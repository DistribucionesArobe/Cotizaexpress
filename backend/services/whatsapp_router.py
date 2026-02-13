"""
CotizaBot - Router Multi-Tenant de WhatsApp
============================================

Arquitectura de UN solo número para TODAS las empresas.
Enrutamiento inteligente basado en:
1. Link único con código de empresa (PRIMARIO)
2. Memoria automática (historial de conversación)
3. Menú de selección (fallback)
4. Detección por IA (último recurso)

REGLA CRÍTICA: Una conversación = Una empresa
Nunca mezclar catálogos ni datos entre empresas.
"""

import uuid
import re
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, List, Tuple
from pydantic import BaseModel
from enum import Enum

logger = logging.getLogger(__name__)


# ============================================
# ENUMS Y CONSTANTES
# ============================================

class RoutingMethod(str, Enum):
    """Método usado para identificar la empresa"""
    CODE_LINK = "code_link"       # Link con código (wa.me/xxx?text=CODE)
    MEMORY = "memory"             # Historial de conversación
    MENU_SELECTION = "menu"       # Usuario seleccionó del menú
    AI_DETECTION = "ai_detection" # IA detectó nombre de empresa
    UNKNOWN = "unknown"           # No identificado


class ConversationState(str, Enum):
    """Estado de la conversación"""
    NEW = "new"                           # Nueva conversación
    AWAITING_COMPANY = "awaiting_company" # Esperando selección de empresa
    ACTIVE = "active"                     # Conversación activa con empresa
    CLOSED = "closed"                     # Conversación cerrada


# ============================================
# MODELOS DE DATOS
# ============================================

class CompanyRouting(BaseModel):
    """Información de enrutamiento de empresa"""
    company_id: str
    company_name: str
    company_code: str
    routing_method: RoutingMethod
    confidence: float = 1.0


class ConversationContext(BaseModel):
    """Contexto de conversación"""
    id: str
    user_phone: str
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    state: ConversationState = ConversationState.NEW
    routing_method: Optional[RoutingMethod] = None
    last_message_at: datetime
    created_at: datetime
    messages_count: int = 0


class RoutingResult(BaseModel):
    """Resultado del proceso de enrutamiento"""
    success: bool
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    routing_method: Optional[RoutingMethod] = None
    requires_selection: bool = False
    available_companies: List[Dict] = []
    message_to_send: Optional[str] = None
    error: Optional[str] = None


# ============================================
# ROUTER PRINCIPAL
# ============================================

class WhatsAppRouter:
    """
    Router Multi-Tenant para CotizaBot.
    Maneja el enrutamiento de mensajes entrantes a la empresa correcta.
    """
    
    def __init__(self, db=None):
        self.db = db
        # Inicializamos siempre como None para evitar errores de referencia
        self.conversations_collection = None
        self.routing_logs_collection = None
        self.companies_collection = None
        
        if db is not None:
            self.conversations_collection = db.get_collection('wa_conversations')if db is not None else None
            self.routing_logs_collection = db.get_collection('wa_routing_logs')if db is not None else None
            self.companies_collection = db.get_collection('empresas')if db is not None else None
        else:
            print("⚠️ WhatsAppRouter iniciado sin MongoDB. El modo Multi-tenant está en pausa.")

    async def route_incoming_message(self, user_phone, message_text, whatsapp_number):
        # 0. Comando CAMBIAR (Esto funciona sin DB porque no la usa)
        mensaje_upper = message_text.strip().upper()
        if mensaje_upper in ['CAMBIAR', 'REINICIAR', 'MENU', 'MENÚ']:
            if self.conversations_collection: # Solo si hay DB
                await self.reset_conversation(user_phone)
            return RoutingResult(
                success=False,
                requires_selection=True,
                message_to_send="🔄 *Conversación reiniciada*\nEnvía el código de la empresa.",
                available_companies=[]
            )

        # PROTECCIÓN: Si no hay base de datos, no intentamos buscar empresas
        if not self.companies_collection:
            return RoutingResult(
                success=False,
                requires_selection=True,
                message_to_send="🤖 *Servidor en mantenimiento*\nLa base de datos no está disponible actualmente.",
                available_companies=[]
            )
        
        # 0.5 PASO DEMO: Si escribe DEMO, activar contexto demo
        if mensaje_upper == 'DEMO':
            # Buscar o crear empresa demo
            empresa_demo = await self.companies_collection.find_one({'id': 'demo'})
            if not empresa_demo:
                empresa_demo = {
                    'id': 'demo',
                    'nombre': 'Demo CotizaBot',
                    'codigo_whatsapp': 'DEMO',
                    'activo': True,
                    'plan': 'demo'
                }
            
            result = RoutingResult(
                success=True,
                company_id='demo',
                company_name='Demo CotizaBot',
                routing_method=RoutingMethod.CODE_LINK,
                message_to_send=(
                    "👋 ¡Hola!\n\n"
                    "Estás en *CotizaBot Demo*.\n"
                    "Prueba cómo cotizo aunque escribas mal o no sepas qué pedir.\n\n"
                    "🔹 _Demo limitada_\n\n"
                    "💡 _Escribe CAMBIAR para salir del demo._"
                )
            )
            await self._save_routing(user_phone, result)
            return result
        
        # 1. PASO 1: Verificar si el mensaje contiene código de empresa
        code_result = await self._check_company_code(message_text)
        if code_result.success:
            await self._save_routing(user_phone, code_result)
            await self._log_routing(user_phone, code_result, message_text)
            return code_result
        
        # 2. PASO 2: Verificar memoria (conversación existente)
        memory_result = await self._check_memory(user_phone)
        if memory_result.success:
            await self._log_routing(user_phone, memory_result, message_text)
            return memory_result
        
        # 3. PASO 3: Verificar si es respuesta a menú de selección
        if message_text.strip().isdigit():
            menu_result = await self._process_menu_selection(user_phone, message_text)
            if menu_result.success:
                await self._save_routing(user_phone, menu_result)
                await self._log_routing(user_phone, menu_result, message_text)
                return menu_result
        
        # 4. PASO 4: Intentar detección por IA/texto
        ai_result = await self._detect_company_by_text(message_text)
        if ai_result.success and ai_result.company_id:
            # Pedir confirmación antes de asignar
            return RoutingResult(
                success=False,
                requires_selection=True,
                message_to_send=self._build_confirmation_message(ai_result),
                available_companies=[{
                    'id': ai_result.company_id,
                    'name': ai_result.company_name,
                    'detected': True
                }]
            )
        
        # 5. PASO 5: Si solo hay UNA empresa, asignar automáticamente
        empresas_activas = await self.companies_collection.find(
            {'activo': True, 'codigo_whatsapp': {'$exists': True}},
            {'_id': 0, 'id': 1, 'nombre': 1}
        ).to_list(10)
        
        if len(empresas_activas) == 1:
            empresa = empresas_activas[0]
            full_empresa = await self.companies_collection.find_one({'id': empresa['id']})
            
            result = RoutingResult(
                success=True,
                company_id=empresa['id'],
                company_name=empresa.get('nombre'),
                routing_method=RoutingMethod.MENU_SELECTION,
                message_to_send=self._build_welcome_message(full_empresa)
            )
            await self._save_routing(user_phone, result)
            return result
        
        # 6. PASO 6: Pedir código de empresa (no mostrar lista)
        return RoutingResult(
            success=False,
            requires_selection=True,
            message_to_send=(
                "🤖 *CotizaBot*\n\n"
                "¡Hola! Para atenderte, necesito saber con qué empresa deseas hablar.\n\n"
                "📌 Envía el *código* de la empresa.\n"
                "_El código lo encuentras en el link o QR que te compartió tu proveedor._\n\n"
                "_Ejemplo: FERRETER, ACEROMX, etc._"
            ),
            available_companies=[]
        )
    
    
    # ============================================
    # MÉTODOS DE IDENTIFICACIÓN
    # ============================================
    
    async def _check_company_code(self, message_text: str) -> RoutingResult:
        """
        PASO 1: Verificar código de empresa en el mensaje.
        
        Patrones soportados:
        - Código solo: "FERRESOL"
        - Con prefijo: "codigo:FERRESOL" 
        - En link: contiene el código al inicio
        """
        message_upper = message_text.strip().upper()
        
        # Buscar empresa por código
        empresa = await self.companies_collection.find_one({
            'codigo_whatsapp': {'$regex': f'^{re.escape(message_upper)}$', '$options': 'i'},
            'activo': True
        })
        
        if not empresa:
            # Intentar buscar si el mensaje EMPIEZA con un código conocido
            empresas = await self.companies_collection.find(
                {'activo': True, 'codigo_whatsapp': {'$exists': True}},
                {'_id': 0, 'id': 1, 'nombre': 1, 'codigo_whatsapp': 1}
            ).to_list(100)
            
            for emp in empresas:
                code = emp.get('codigo_whatsapp', '').upper()
                if code and message_upper.startswith(code):
                    empresa = await self.companies_collection.find_one({'id': emp['id']})
                    break
        
        if empresa:
            return RoutingResult(
                success=True,
                company_id=empresa['id'],
                company_name=empresa.get('nombre'),
                routing_method=RoutingMethod.CODE_LINK,
                message_to_send=self._build_welcome_message(empresa)
            )
        
        return RoutingResult(success=False)
    
    
    async def _check_memory(self, user_phone: str) -> RoutingResult:
        """
        PASO 2: Verificar si el usuario ya tiene una conversación activa.
        
        REGLA: Si ya habló con una empresa, siempre continúa con esa.
        Busca en: wa_conversations Y en clientes (por empresa_id asignada)
        """
        # Buscar en wa_conversations primero
        conversation = await self.conversations_collection.find_one({
            'user_phone': user_phone,
            'state': {'$in': [ConversationState.ACTIVE, ConversationState.NEW, 'active', 'new']}
        }, sort=[('last_message_at', -1)])
        
        if conversation and conversation.get('company_id'):
            empresa = await self.companies_collection.find_one({
                'id': conversation['company_id'],
                'activo': True
            })
            
            if empresa:
                # Actualizar timestamp
                await self.conversations_collection.update_one(
                    {'_id': conversation['_id']},
                    {'$set': {
                        'last_message_at': datetime.now(timezone.utc),
                        'messages_count': conversation.get('messages_count', 0) + 1
                    }}
                )
                
                return RoutingResult(
                    success=True,
                    company_id=empresa['id'],
                    company_name=empresa.get('nombre'),
                    routing_method=RoutingMethod.MEMORY
                )
        
        # Buscar también en clientes por si tiene empresa asignada
        clientes_collection = self.db.get_collection('clientes')if db is not None else None
        cliente = await clientes_collection.find_one({'telefono': user_phone})
        
        if cliente and cliente.get('empresa_id'):
            empresa = await self.companies_collection.find_one({
                'id': cliente['empresa_id'],
                'activo': True
            })
            
            if empresa:
                # Crear/actualizar conversación en wa_conversations
                await self.conversations_collection.update_one(
                    {'user_phone': user_phone},
                    {
                        '$set': {
                            'company_id': empresa['id'],
                            'company_name': empresa.get('nombre'),
                            'state': ConversationState.ACTIVE,
                            'last_message_at': datetime.now(timezone.utc)
                        },
                        '$setOnInsert': {
                            'id': str(uuid.uuid4()),
                            'user_phone': user_phone,
                            'created_at': datetime.now(timezone.utc)
                        },
                        '$inc': {'messages_count': 1}
                    },
                    upsert=True
                )
                
                return RoutingResult(
                    success=True,
                    company_id=empresa['id'],
                    company_name=empresa.get('nombre'),
                    routing_method=RoutingMethod.MEMORY
                )
        
        return RoutingResult(success=False)
    
    
    async def _process_menu_selection(self, user_phone: str, selection: str) -> RoutingResult:
        """
        PASO 3: Procesar selección del menú.
        
        El usuario envió un número (1, 2, 3...) para seleccionar empresa.
        """
        try:
            selection_num = int(selection.strip())
        except ValueError:
            return RoutingResult(success=False)
        
        # Obtener la lista de empresas activas (mismo orden que el menú)
        empresas = await self.companies_collection.find(
            {'activo': True, 'codigo_whatsapp': {'$exists': True}},
            {'_id': 0, 'id': 1, 'nombre': 1}
        ).sort('nombre', 1).to_list(50)
        
        if 1 <= selection_num <= len(empresas):
            empresa = empresas[selection_num - 1]
            full_empresa = await self.companies_collection.find_one({'id': empresa['id']})
            
            return RoutingResult(
                success=True,
                company_id=empresa['id'],
                company_name=empresa.get('nombre'),
                routing_method=RoutingMethod.MENU_SELECTION,
                message_to_send=self._build_welcome_message(full_empresa)
            )
        
        return RoutingResult(success=False)
    
    
    async def _detect_company_by_text(self, message_text: str) -> RoutingResult:
        """
        PASO 4: Intentar detectar empresa por nombre en el texto.
        
        Busca menciones de nombres de empresa en el mensaje.
        """
        message_lower = message_text.lower()
        
        empresas = await self.companies_collection.find(
            {'activo': True},
            {'_id': 0, 'id': 1, 'nombre': 1}
        ).to_list(100)
        
        for empresa in empresas:
            nombre = empresa.get('nombre', '').lower()
            # Buscar nombre completo o parcial (mínimo 4 caracteres)
            if len(nombre) >= 4 and nombre in message_lower:
                return RoutingResult(
                    success=True,
                    company_id=empresa['id'],
                    company_name=empresa.get('nombre'),
                    routing_method=RoutingMethod.AI_DETECTION
                )
        
        return RoutingResult(success=False)
    
    
    # ============================================
    # CONSTRUCCIÓN DE MENSAJES
    # ============================================
    
    def _build_welcome_message(self, empresa: dict) -> str:
        """Construye mensaje de bienvenida personalizado"""
        nombre = empresa.get('nombre', 'la empresa')
        mensaje_bienvenida = empresa.get('whatsapp_welcome_message')
        
        tip_cambiar = "\n\n💡 _Escribe *CAMBIAR* en cualquier momento si deseas hablar con otra empresa._"
        
        if mensaje_bienvenida:
            return f"🤖 CotizaBot – {nombre}\n\n{mensaje_bienvenida}{tip_cambiar}"
        
        return (
            f"🤖 CotizaBot – {nombre}\n\n"
            f"¡Hola! Soy el asistente virtual de {nombre}.\n"
            f"¿En qué puedo ayudarte hoy?\n\n"
            f"Puedo ayudarte con:\n"
            f"• Cotizaciones de productos\n"
            f"• Consulta de precios\n"
            f"• Disponibilidad de inventario\n"
            f"• Seguimiento de pedidos"
            f"{tip_cambiar}"
        )
    
    
    def _build_confirmation_message(self, result: RoutingResult) -> str:
        """Mensaje de confirmación cuando se detecta empresa por IA"""
        return (
            f"🤖 CotizaBot\n\n"
            f"¿Deseas hablar con *{result.company_name}*?\n\n"
            f"Responde:\n"
            f"*1* - Sí, continuar\n"
            f"*2* - No, elegir otra empresa"
        )
    
    
    async def _build_selection_menu(self, user_phone: str) -> Tuple[str, List[Dict]]:
        """Construye el menú de selección de empresas"""
        empresas = await self.companies_collection.find(
            {'activo': True, 'codigo_whatsapp': {'$exists': True}},
            {'_id': 0, 'id': 1, 'nombre': 1, 'codigo_whatsapp': 1}
        ).sort('nombre', 1).to_list(50)
        
        if not empresas:
            return (
                "🤖 CotizaBot\n\n"
                "No hay empresas disponibles en este momento.\n"
                "Por favor, intenta más tarde.",
                []
            )
        
        menu_lines = ["🤖 CotizaBot\n", "¡Hola! ¿Con qué empresa deseas cotizar?\n"]
        
        companies_list = []
        for i, empresa in enumerate(empresas, 1):
            menu_lines.append(f"*{i}* - {empresa['nombre']}")
            companies_list.append({
                'id': empresa['id'],
                'name': empresa['nombre'],
                'code': empresa.get('codigo_whatsapp')
            })
        
        menu_lines.append("\nResponde con el número de tu elección.")
        
        # Guardar estado esperando selección
        await self.conversations_collection.update_one(
            {'user_phone': user_phone},
            {
                '$set': {
                    'state': ConversationState.AWAITING_COMPANY,
                    'last_message_at': datetime.now(timezone.utc)
                },
                '$setOnInsert': {
                    'id': str(uuid.uuid4()),
                    'user_phone': user_phone,
                    'created_at': datetime.now(timezone.utc),
                    'messages_count': 0
                }
            },
            upsert=True
        )
        
        return "\n".join(menu_lines), companies_list
    
    
    # ============================================
    # PERSISTENCIA Y LOGGING
    # ============================================
    
    async def _save_routing(self, user_phone: str, result: RoutingResult):
        """Guarda el enrutamiento en la conversación"""
        await self.conversations_collection.update_one(
            {'user_phone': user_phone},
            {
                '$set': {
                    'company_id': result.company_id,
                    'company_name': result.company_name,
                    'state': ConversationState.ACTIVE,
                    'routing_method': result.routing_method,
                    'last_message_at': datetime.now(timezone.utc)
                },
                '$setOnInsert': {
                    'id': str(uuid.uuid4()),
                    'user_phone': user_phone,
                    'created_at': datetime.now(timezone.utc)
                },
                '$inc': {'messages_count': 1}
            },
            upsert=True
        )
    
    
    async def _log_routing(self, user_phone: str, result: RoutingResult, message: str):
        """Registra el enrutamiento para auditoría"""
        await self.routing_logs_collection.insert_one({
            'id': str(uuid.uuid4()),
            'user_phone': user_phone,
            'company_id': result.company_id,
            'company_name': result.company_name,
            'routing_method': result.routing_method,
            'message_preview': message[:100] if message else None,
            'timestamp': datetime.now(timezone.utc)
        })
    
    
    # ============================================
    # MÉTODOS DE UTILIDAD
    # ============================================
    
    async def get_conversation(self, user_phone: str) -> Optional[Dict]:
        """Obtiene la conversación activa de un usuario"""
        return await self.conversations_collection.find_one(
            {'user_phone': user_phone},
            {'_id': 0}
        )
    
    
    async def reset_conversation(self, user_phone: str) -> bool:
        """Reinicia la conversación de un usuario (para cambiar de empresa)"""
        result = await self.conversations_collection.update_one(
            {'user_phone': user_phone},
            {'$set': {
                'state': ConversationState.NEW,
                'company_id': None,
                'company_name': None,
                'routing_method': None
            }}
        )
        return result.modified_count > 0
    
    
    async def get_company_context(self, company_id: str) -> Optional[Dict]:
        """Obtiene el contexto completo de una empresa para el bot"""
        empresa = await self.companies_collection.find_one(
            {'id': company_id, 'activo': True},
            {'_id': 0}
        )
        
        if not empresa:
            return None
        
        # Verificar si tiene Plan Pro y cobros configurados
        plan = empresa.get('plan', 'gratis')
        tiene_plan_pro = plan == 'pro'
        
        # Verificar métodos de cobro disponibles
        metodos_cobro = []
        if tiene_plan_pro:
            # Verificar Mercado Pago
            config_cobros = empresa.get('config_cobros', {})
            if config_cobros.get('mercadopago_access_token'):
                metodos_cobro.append('mercadopago')
            
            # Verificar SPEI/Transferencia
            datos_bancarios = empresa.get('datos_bancarios', {})
            if datos_bancarios.get('clabe'):
                metodos_cobro.append('spei')
        
        return {
            'company_id': empresa['id'],
            'company_name': empresa.get('nombre'),
            'company_code': empresa.get('codigo_whatsapp'),
            'ai_prompt': empresa.get('ai_prompt'),
            'tone': empresa.get('ai_tone', 'profesional'),
            'working_hours': empresa.get('horario_atencion'),
            'contact_info': {
                'telefono': empresa.get('telefono'),
                'email': empresa.get('email'),
                'direccion': empresa.get('direccion')
            },
            'price_rules': empresa.get('reglas_precios', {}),
            'welcome_message': empresa.get('whatsapp_welcome_message'),
            # Datos para flujo de cobros (Plan Pro)
            'plan': plan,
            'tiene_plan_pro': tiene_plan_pro,
            'metodos_cobro': metodos_cobro,
            'config_cobros': empresa.get('config_cobros', {}) if tiene_plan_pro else {},
            'datos_bancarios': empresa.get('datos_bancarios', {}) if tiene_plan_pro else {}
        }


# ============================================
# FUNCIONES DE ONBOARDING
# ============================================

async def generate_company_whatsapp_assets(db, company_id: str, whatsapp_number: str) -> Dict:
    """
    Genera todos los assets de WhatsApp para una empresa:
    - Código único
    - Link de WhatsApp
    - QR Code (URL)
    - Texto de instrucciones
    """
    empresas_collection = db.get_collection('empresas')if db is not None else None
    
    empresa = await empresas_collection.find_one({'id': company_id})
    if not empresa:
        raise ValueError(f"Empresa {company_id} no encontrada")
    
    # Generar código único (si no existe)
    codigo = empresa.get('codigo_whatsapp')
    if not codigo:
        # Generar código basado en nombre (máx 10 caracteres, sin espacios)
        nombre = empresa.get('nombre', 'EMPRESA')
        codigo_base = re.sub(r'[^A-Z0-9]', '', nombre.upper())[:8]
        
        # Verificar unicidad
        existing = await empresas_collection.find_one({'codigo_whatsapp': codigo_base})
        if existing:
            codigo = f"{codigo_base}{str(uuid.uuid4())[:4].upper()}"
        else:
            codigo = codigo_base
    
    # Construir link de WhatsApp
    # Formato: wa.me/NUMERO?text=CODIGO
    numero_limpio = re.sub(r'[^\d]', '', whatsapp_number)
    whatsapp_link = f"https://wa.me/{numero_limpio}?text={codigo}"
    
    # URL para generar QR (usando API gratuita)
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={whatsapp_link}"
    
    # Texto de instrucciones para clientes finales
    instrucciones = (
        f"📱 *¡Cotiza por WhatsApp!*\n\n"
        f"Escanea el código QR o haz clic en el enlace:\n"
        f"{whatsapp_link}\n\n"
        f"También puedes agregar el número {whatsapp_number} "
        f"y enviar el código: *{codigo}*"
    )
    
    # Guardar en la empresa
    await empresas_collection.update_one(
        {'id': company_id},
        {'$set': {
            'codigo_whatsapp': codigo,
            'whatsapp_link': whatsapp_link,
            'whatsapp_qr_url': qr_url,
            'whatsapp_instrucciones': instrucciones,
            'whatsapp_updated_at': datetime.now(timezone.utc).isoformat()
        }}
    )
    
    logger.info(f"Assets de WhatsApp generados para empresa {company_id}: código={codigo}")
    
    return {
        'codigo': codigo,
        'link': whatsapp_link,
        'qr_url': qr_url,
        'instrucciones': instrucciones,
        'numero': whatsapp_number
    }


async def get_company_whatsapp_info(db, company_id: str) -> Optional[Dict]:
    """Obtiene la información de WhatsApp de una empresa"""
    empresas_collection = db.get_collection('empresas')if db is not None else None
    
    empresa = await empresas_collection.find_one(
        {'id': company_id},
        {
            '_id': 0,
            'id': 1,
            'nombre': 1,
            'codigo_whatsapp': 1,
            'whatsapp_link': 1,
            'whatsapp_qr_url': 1,
            'whatsapp_instrucciones': 1
        }
    )
    
    return empresa


# Instancia global del router
from database import db
whatsapp_router = WhatsAppRouter(db)

