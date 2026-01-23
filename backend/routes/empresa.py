from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from utils.auth import get_current_user
from database import db
from datetime import datetime, timezone
import os
import uuid
import logging
from pathlib import Path

router = APIRouter(prefix="/empresa", tags=["empresa"])
logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')

# Directorio para almacenar logos
LOGOS_DIR = Path("/app/backend/static/logos")
LOGOS_DIR.mkdir(parents=True, exist_ok=True)

# Formatos permitidos
ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.svg'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

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
