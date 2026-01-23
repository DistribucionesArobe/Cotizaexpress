from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel, EmailStr
from typing import Optional
from utils.auth import get_current_user
from database import db
from services.email_service import email_service
from datetime import datetime, timezone
import os
import uuid
import logging
from pathlib import Path

router = APIRouter(prefix="/empresa", tags=["empresa"])
logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')
solicitudes_factura_collection = db.get_collection('solicitudes_factura')

# Directorio para almacenar logos
LOGOS_DIR = Path("/app/backend/static/logos")
LOGOS_DIR.mkdir(parents=True, exist_ok=True)

# Formatos permitidos
ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.svg'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Regímenes fiscales SAT
REGIMENES_FISCALES = [
    {"codigo": "601", "nombre": "General de Ley Personas Morales"},
    {"codigo": "603", "nombre": "Personas Morales con Fines no Lucrativos"},
    {"codigo": "605", "nombre": "Sueldos y Salarios e Ingresos Asimilados a Salarios"},
    {"codigo": "606", "nombre": "Arrendamiento"},
    {"codigo": "607", "nombre": "Régimen de Enajenación o Adquisición de Bienes"},
    {"codigo": "608", "nombre": "Demás ingresos"},
    {"codigo": "610", "nombre": "Residentes en el Extranjero sin Establecimiento Permanente en México"},
    {"codigo": "611", "nombre": "Ingresos por Dividendos (socios y accionistas)"},
    {"codigo": "612", "nombre": "Personas Físicas con Actividades Empresariales y Profesionales"},
    {"codigo": "614", "nombre": "Ingresos por intereses"},
    {"codigo": "615", "nombre": "Régimen de los ingresos por obtención de premios"},
    {"codigo": "616", "nombre": "Sin obligaciones fiscales"},
    {"codigo": "620", "nombre": "Sociedades Cooperativas de Producción que optan por diferir sus ingresos"},
    {"codigo": "621", "nombre": "Incorporación Fiscal"},
    {"codigo": "622", "nombre": "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras"},
    {"codigo": "623", "nombre": "Opcional para Grupos de Sociedades"},
    {"codigo": "624", "nombre": "Coordinados"},
    {"codigo": "625", "nombre": "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas"},
    {"codigo": "626", "nombre": "Régimen Simplificado de Confianza"},
]

# Usos CFDI SAT
USOS_CFDI = [
    {"codigo": "G01", "nombre": "Adquisición de mercancías"},
    {"codigo": "G02", "nombre": "Devoluciones, descuentos o bonificaciones"},
    {"codigo": "G03", "nombre": "Gastos en general"},
    {"codigo": "I01", "nombre": "Construcciones"},
    {"codigo": "I02", "nombre": "Mobiliario y equipo de oficina por inversiones"},
    {"codigo": "I03", "nombre": "Equipo de transporte"},
    {"codigo": "I04", "nombre": "Equipo de cómputo y accesorios"},
    {"codigo": "I05", "nombre": "Dados, troqueles, moldes, matrices y herramental"},
    {"codigo": "I06", "nombre": "Comunicaciones telefónicas"},
    {"codigo": "I07", "nombre": "Comunicaciones satelitales"},
    {"codigo": "I08", "nombre": "Otra maquinaria y equipo"},
    {"codigo": "D01", "nombre": "Honorarios médicos, dentales y gastos hospitalarios"},
    {"codigo": "D02", "nombre": "Gastos médicos por incapacidad o discapacidad"},
    {"codigo": "D03", "nombre": "Gastos funerales"},
    {"codigo": "D04", "nombre": "Donativos"},
    {"codigo": "D05", "nombre": "Intereses reales efectivamente pagados por créditos hipotecarios"},
    {"codigo": "D06", "nombre": "Aportaciones voluntarias al SAR"},
    {"codigo": "D07", "nombre": "Primas por seguros de gastos médicos"},
    {"codigo": "D08", "nombre": "Gastos de transportación escolar obligatoria"},
    {"codigo": "D09", "nombre": "Depósitos en cuentas para el ahorro, primas de pensiones"},
    {"codigo": "D10", "nombre": "Pagos por servicios educativos (colegiaturas)"},
    {"codigo": "S01", "nombre": "Sin efectos fiscales"},
    {"codigo": "CP01", "nombre": "Pagos"},
    {"codigo": "CN01", "nombre": "Nómina"},
]

class DatosFiscalesUpdate(BaseModel):
    rfc: Optional[str] = None
    razon_social: Optional[str] = None
    regimen_fiscal: Optional[str] = None
    uso_cfdi: Optional[str] = None
    codigo_postal: Optional[str] = None
    domicilio_fiscal: Optional[str] = None
    email_factura: Optional[EmailStr] = None

class SolicitudFacturaRequest(BaseModel):
    cotizacion_folio: Optional[str] = None
    pago_referencia: Optional[str] = None
    notas: Optional[str] = None

@router.get("/catalogos/regimenes-fiscales")
async def obtener_regimenes_fiscales():
    """Obtiene catálogo de regímenes fiscales del SAT"""
    return {"regimenes": REGIMENES_FISCALES}

@router.get("/catalogos/usos-cfdi")
async def obtener_usos_cfdi():
    """Obtiene catálogo de usos CFDI del SAT"""
    return {"usos_cfdi": USOS_CFDI}

@router.post("/logo")
async def subir_logo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Sube o actualiza el logo de la empresa para cotizaciones"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Validar extensión
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Formato no permitido. Usa: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Leer archivo
        contents = await file.read()
        
        # Validar tamaño
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"El archivo es muy grande. Máximo: {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Generar nombre único
        filename = f"{empresa_id}_{uuid.uuid4().hex[:8]}{file_ext}"
        file_path = LOGOS_DIR / filename
        
        # Eliminar logo anterior si existe
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if empresa and empresa.get('logo_path'):
            old_logo = Path(empresa['logo_path'])
            if old_logo.exists():
                old_logo.unlink()
        
        # Guardar nuevo logo
        with open(file_path, 'wb') as f:
            f.write(contents)
        
        # Actualizar empresa
        logo_url = f"/api/empresa/logo/{filename}"
        
        await empresas_collection.update_one(
            {'id': empresa_id},
            {
                '$set': {
                    'logo_path': str(file_path),
                    'logo_url': logo_url,
                    'logo_filename': filename,
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Logo actualizado para empresa {empresa_id}: {filename}")
        
        return {
            "success": True,
            "mensaje": "Logo actualizado exitosamente",
            "logo_url": logo_url,
            "filename": filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error subiendo logo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error subiendo logo: {str(e)}")

@router.get("/logo/{filename}")
async def obtener_logo(filename: str):
    """Sirve el logo de una empresa"""
    from fastapi.responses import FileResponse
    
    file_path = LOGOS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Logo no encontrado")
    
    # Determinar content type
    ext = Path(filename).suffix.lower()
    content_types = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
    }
    
    return FileResponse(
        file_path,
        media_type=content_types.get(ext, 'application/octet-stream')
    )

@router.delete("/logo")
async def eliminar_logo(current_user: dict = Depends(get_current_user)):
    """Elimina el logo de la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        # Eliminar archivo si existe
        if empresa.get('logo_path'):
            logo_path = Path(empresa['logo_path'])
            if logo_path.exists():
                logo_path.unlink()
        
        # Actualizar empresa
        await empresas_collection.update_one(
            {'id': empresa_id},
            {
                '$set': {
                    'logo_path': None,
                    'logo_url': None,
                    'logo_filename': None,
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Logo eliminado para empresa {empresa_id}")
        
        return {
            "success": True,
            "mensaje": "Logo eliminado"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando logo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/perfil")
async def obtener_perfil_empresa(current_user: dict = Depends(get_current_user)):
    """Obtiene el perfil de la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        return {
            "id": empresa.get('id'),
            "nombre": empresa.get('nombre'),
            "rfc": empresa.get('rfc'),
            "telefono": empresa.get('telefono'),
            "email": empresa.get('email'),
            "direccion": empresa.get('direccion'),
            "logo_url": empresa.get('logo_url'),
            "plan": empresa.get('plan', 'gratis'),
            "subscription_status": empresa.get('subscription_status'),
            "datos_fiscales": empresa.get('datos_fiscales'),
            "created_at": empresa.get('created_at')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo perfil: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/perfil")
async def actualizar_perfil_empresa(
    datos: dict,
    current_user: dict = Depends(get_current_user)
):
    """Actualiza el perfil de la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Campos permitidos para actualizar
        campos_permitidos = ['nombre', 'rfc', 'telefono', 'email', 'direccion']
        actualizacion = {
            k: v for k, v in datos.items() 
            if k in campos_permitidos and v is not None
        }
        
        if not actualizacion:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")
        
        actualizacion['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        await empresas_collection.update_one(
            {'id': empresa_id},
            {'$set': actualizacion}
        )
        
        return {
            "success": True,
            "mensaje": "Perfil actualizado"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando perfil: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/datos-fiscales")
async def actualizar_datos_fiscales(
    datos: DatosFiscalesUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Actualiza los datos fiscales de la empresa para facturación CFDI"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        datos_dict = datos.model_dump(exclude_none=True)
        
        if not datos_dict:
            raise HTTPException(status_code=400, detail="No hay datos para actualizar")
        
        await empresas_collection.update_one(
            {'id': empresa_id},
            {
                '$set': {
                    'datos_fiscales': datos_dict,
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Datos fiscales actualizados para empresa {empresa_id}")
        
        return {
            "success": True,
            "mensaje": "Datos fiscales actualizados"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando datos fiscales: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/datos-fiscales")
async def obtener_datos_fiscales(current_user: dict = Depends(get_current_user)):
    """Obtiene los datos fiscales de la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        return {
            "datos_fiscales": empresa.get('datos_fiscales') or {},
            "tiene_datos_completos": bool(
                empresa.get('datos_fiscales', {}).get('rfc') and 
                empresa.get('datos_fiscales', {}).get('razon_social')
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo datos fiscales: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/solicitar-factura")
async def solicitar_factura(
    request: SolicitudFacturaRequest,
    current_user: dict = Depends(get_current_user)
):
    """Envía solicitud de factura CFDI al equipo de CotizaBot"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        # Obtener empresa y datos fiscales
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        datos_fiscales = empresa.get('datos_fiscales', {})
        
        # Validar que tenga datos fiscales mínimos
        if not datos_fiscales.get('rfc') or not datos_fiscales.get('razon_social'):
            raise HTTPException(
                status_code=400,
                detail="Primero completa tus datos fiscales (RFC y Razón Social son obligatorios)"
            )
        
        # Crear registro de solicitud
        solicitud_id = str(uuid.uuid4())
        solicitud = {
            "id": solicitud_id,
            "empresa_id": empresa_id,
            "empresa_nombre": empresa.get('nombre'),
            "datos_fiscales": datos_fiscales,
            "cotizacion_folio": request.cotizacion_folio,
            "pago_referencia": request.pago_referencia,
            "notas": request.notas,
            "estado": "pendiente",  # pendiente, procesando, completada, rechazada
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await solicitudes_factura_collection.insert_one(solicitud)
        
        # Enviar email al equipo
        email_result = await email_service.enviar_solicitud_factura(
            empresa=empresa,
            datos_fiscales=datos_fiscales,
            cotizacion_folio=request.cotizacion_folio or request.pago_referencia or solicitud_id
        )
        
        logger.info(f"Solicitud de factura creada: {solicitud_id}")
        
        return {
            "success": True,
            "solicitud_id": solicitud_id,
            "mensaje": "Solicitud de factura enviada. Recibirás tu factura en 24-48 horas hábiles.",
            "email_enviado": email_result.get('success', False)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error solicitando factura: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/solicitudes-factura")
async def listar_solicitudes_factura(current_user: dict = Depends(get_current_user)):
    """Lista las solicitudes de factura de la empresa"""
    try:
        empresa_id = current_user.get('empresa_id')
        
        solicitudes = await solicitudes_factura_collection.find(
            {'empresa_id': empresa_id},
            {'_id': 0}
        ).sort('created_at', -1).to_list(50)
        
        return {"solicitudes": solicitudes}
        
    except Exception as e:
        logger.error(f"Error listando solicitudes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
