from fastapi import APIRouter, HTTPException, status, Depends
from models.usuario import UsuarioCreate, UsuarioLogin, Token, Usuario
from models.empresa import Empresa
from utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from database import db
import uuid
from datetime import datetime, timezone, timedelta
import logging

router = APIRouter(prefix="/auth", tags=["autenticacion"])
logger = logging.getLogger(__name__)

usuarios_collection = db.get_collection('usuarios')
empresas_collection = db.get_collection('empresas')

@router.post("/registro", response_model=Token, status_code=status.HTTP_201_CREATED)
async def registrar_usuario(usuario_data: UsuarioCreate):
    """Registro de nuevo usuario y empresa"""
    try:
        # Verificar si el email ya existe
        usuario_existente = await usuarios_collection.find_one({'email': usuario_data.email})
        if usuario_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='El email ya está registrado'
            )
        
        # Crear empresa
        empresa_id = str(uuid.uuid4())
        empresa = {
            'id': empresa_id,
            'nombre': usuario_data.empresa_nombre,
            'telefono': usuario_data.telefono,
            'email': usuario_data.email,
            'plan': 'demo',  # Empieza con plan demo
            'activo': True,
            'monto_mensual': 1000.0,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await empresas_collection.insert_one(empresa)
        
        # Crear usuario
        usuario_id = str(uuid.uuid4())
        usuario = {
            'id': usuario_id,
            'email': usuario_data.email,
            'password_hash': get_password_hash(usuario_data.password),
            'nombre': usuario_data.nombre,
            'empresa_id': empresa_id,
            'empresa_nombre': usuario_data.empresa_nombre,
            'rol': 'admin',
            'activo': True,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await usuarios_collection.insert_one(usuario)
        
        # Crear token
        access_token = create_access_token(
            data={
                'sub': usuario_id,
                'email': usuario_data.email,
                'empresa_id': empresa_id,
                'rol': 'admin'
            }
        )
        
        logger.info(f"Usuario registrado: {usuario_data.email}, Empresa: {usuario_data.empresa_nombre}")
        
        return Token(
            access_token=access_token,
            usuario={
                'id': usuario_id,
                'email': usuario_data.email,
                'nombre': usuario_data.nombre,
                'empresa_id': empresa_id,
                'empresa_nombre': usuario_data.empresa_nombre,
                'plan': 'demo'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en registro: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Error al registrar usuario'
        )

@router.post("/login", response_model=Token)
async def iniciar_sesion(credenciales: UsuarioLogin):
    """Inicio de sesión"""
    try:
        # Buscar usuario
        usuario = await usuarios_collection.find_one({'email': credenciales.email})
        
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Email o contraseña incorrectos'
            )
        
        # Verificar contraseña
        if not verify_password(credenciales.password, usuario['password_hash']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Email o contraseña incorrectos'
            )
        
        # Verificar que la empresa esté activa
        empresa = await empresas_collection.find_one({'id': usuario['empresa_id']})
        if not empresa or not empresa.get('activo', False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Empresa inactiva. Contacta a soporte.'
            )
        
        # Crear token
        access_token = create_access_token(
            data={
                'sub': usuario['id'],
                'email': usuario['email'],
                'empresa_id': usuario['empresa_id'],
                'rol': usuario.get('rol', 'admin')
            }
        )
        
        logger.info(f"Login exitoso: {credenciales.email}")
        
        return Token(
            access_token=access_token,
            usuario={
                'id': usuario['id'],
                'email': usuario['email'],
                'nombre': usuario['nombre'],
                'empresa_id': usuario['empresa_id'],
                'empresa_nombre': usuario.get('empresa_nombre', ''),
                'plan': empresa.get('plan', 'demo')
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Error al iniciar sesión'
        )

@router.get("/me")
async def obtener_usuario_actual(current_user: dict = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    try:
        usuario = await usuarios_collection.find_one(
            {'id': current_user['sub']},
            {'_id': 0, 'password_hash': 0}
        )
        
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Usuario no encontrado'
            )
        
        empresa = await empresas_collection.find_one(
            {'id': usuario['empresa_id']},
            {'_id': 0}
        )
        
        return {
            'usuario': usuario,
            'empresa': empresa
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo usuario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Error al obtener usuario'
        )
