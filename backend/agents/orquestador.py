from typing import Literal
from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.clasificador import AgenteClasificador
from agents.agente_cotizador import AgenteCotizador
from agents.agente_operativo import AgenteOperativo
from agents.agente_compliance import AgenteCompliance
from agents.agente_cobros import AgenteCobros
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class OrquestadorCotizaBot:
    """Orquestador principal del sistema multi-agente usando LangGraph"""
    
    def __init__(self):
        self.clasificador = AgenteClasificador()
        self.cotizador = AgenteCotizador()
        self.operativo = AgenteOperativo()
        self.compliance = AgenteCompliance()
        self.cobros = AgenteCobros()
        
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Construye el grafo de estados del sistema"""
        workflow = StateGraph(AgentState)
        
        # Nodos del grafo
        workflow.add_node("clasificar", self._nodo_clasificar)
        workflow.add_node("cotizar", self._nodo_cotizar)
        workflow.add_node("stock", self._nodo_stock)
        workflow.add_node("compliance", self._nodo_compliance)
        workflow.add_node("confirmar", self._nodo_confirmar_cotizacion)
        workflow.add_node("metodo_pago", self._nodo_metodo_pago)
        workflow.add_node("finalizar", self._nodo_finalizar)
        
        # Punto de entrada
        workflow.set_entry_point("clasificar")
        
        # Rutas condicionales
        workflow.add_conditional_edges(
            "clasificar",
            self._decidir_ruta_intencion,
            {
                "cotizar": "cotizar",
                "stock": "stock",
                "confirmar": "confirmar",
                "metodo_pago": "metodo_pago",
                "otro": "finalizar"
            }
        )
        
        workflow.add_edge("cotizar", "compliance")
        workflow.add_edge("compliance", "finalizar")
        workflow.add_edge("stock", "finalizar")
        workflow.add_edge("confirmar", "finalizar")
        workflow.add_edge("metodo_pago", "finalizar")
        workflow.add_edge("finalizar", END)
        
        return workflow.compile()
    
    def _decidir_ruta_intencion(self, state: AgentState) -> Literal["cotizar", "stock", "confirmar", "metodo_pago", "otro"]:
        """Decide qué agente ejecutar según la intención"""
        intencion = state.get('intencion', 'OTRO')
        
        if intencion == 'COTIZAR':
            return "cotizar"
        elif intencion == 'STOCK':
            return "stock"
        elif intencion == 'CONFIRMAR':
            return "confirmar"
        elif intencion == 'METODO_PAGO':
            return "metodo_pago"
        else:
            return "otro"
    
    async def _nodo_clasificar(self, state: AgentState) -> AgentState:
        """Nodo que clasifica la intención"""
        logger.info("Ejecutando nodo: clasificar")
        resultado = await self.clasificador.clasificar(state)
        return {**state, **resultado}
    
    async def _nodo_cotizar(self, state: AgentState) -> AgentState:
        """Nodo que procesa cotizaciones"""
        logger.info("Ejecutando nodo: cotizar")
        resultado = await self.cotizador.procesar(state)
        return {**state, **resultado}
    
    async def _nodo_stock(self, state: AgentState) -> AgentState:
        """Nodo que maneja consultas de stock"""
        logger.info("Ejecutando nodo: stock")
        resultado = await self.operativo.procesar(state)
        return {**state, **resultado}
    
    async def _nodo_compliance(self, state: AgentState) -> AgentState:
        """Nodo que valida compliance"""
        logger.info("Ejecutando nodo: compliance")
        resultado = await self.compliance.validar(state)
        return {**state, **resultado}
    
    async def _nodo_confirmar_cotizacion(self, state: AgentState) -> AgentState:
        """Nodo que maneja la confirmación de cotización y ofrece métodos de pago"""
        logger.info("Ejecutando nodo: confirmar_cotizacion")
        resultado = await self.cobros.ofrecer_metodos_pago(state)
        return {**state, **resultado}
    
    async def _nodo_metodo_pago(self, state: AgentState) -> AgentState:
        """Nodo que procesa la selección del método de pago"""
        logger.info("Ejecutando nodo: metodo_pago")
        resultado = await self.cobros.procesar_metodo_pago(state)
        return {**state, **resultado}
    
    async def _nodo_finalizar(self, state: AgentState) -> AgentState:
        """Nodo que consolida la respuesta final"""
        logger.info("Ejecutando nodo: finalizar")
        
        # Consolidar respuesta final
        respuesta_final = ""
        
        # Prioridad: cobros > cotizador > operativo > compliance
        if state.get('respuesta_cobros'):
            respuesta_final = state['respuesta_cobros']
        elif state.get('respuesta_cotizador'):
            respuesta_final += state['respuesta_cotizador']
        
        if state.get('respuesta_compliance') and not state.get('respuesta_cobros'):
            respuesta_final += state['respuesta_compliance']
        
        if state.get('respuesta_operativo'):
            respuesta_final = state['respuesta_operativo']
        
        if not respuesta_final:
            # Respuesta genérica para otras intenciones
            respuesta_final = "Gracias por tu mensaje. ¿Cómo puedo ayudarte con materiales de construcción hoy?"
            state['accion'] = 'enviar_mensaje'
        
        return {
            **state,
            'respuesta_final': respuesta_final
        }
    
    async def procesar_mensaje(self, mensaje: str, cliente_telefono: str, 
                              conversacion_id: str, cliente_nombre: str = None,
                              historial: list = None, empresa_id: str = None,
                              empresa_context: dict = None) -> dict:
        """Procesa un mensaje entrante y devuelve la respuesta"""
        
        # Estado inicial
        estado_inicial: AgentState = {
            'mensaje': mensaje,
            'cliente_telefono': cliente_telefono,
            'conversacion_id': conversacion_id,
            'intencion': None,
            'confianza_intencion': 0.0,
            'cliente_id': None,
            'cliente_nombre': cliente_nombre,
            'historial_cliente': historial if historial else [],
            'empresa_id': empresa_id,  # ID de la empresa multi-tenant
            'empresa_context': empresa_context,  # Contexto completo de la empresa
            'cotizacion_actual': None,
            'productos_solicitados': [],
            'respuesta_cotizador': None,
            'respuesta_comercial': None,
            'respuesta_operativo': None,
            'respuesta_compliance': None,
            'respuesta_final': '',
            'accion': None,
            'agentes_ejecutados': [],
            'errores': [],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Ejecutar el grafo
        resultado_final = await self.graph.ainvoke(estado_inicial)
        
        logger.info(f"Orquestador completó. Agentes ejecutados: {resultado_final['agentes_ejecutados']}")
        
        return {
            'respuesta': resultado_final['respuesta_final'],
            'accion': resultado_final.get('accion', 'enviar_mensaje'),
            'intencion': resultado_final.get('intencion'),
            'productos': resultado_final.get('productos_solicitados', []),
            'agentes_ejecutados': resultado_final['agentes_ejecutados'],
            'errores': resultado_final['errores']
        }