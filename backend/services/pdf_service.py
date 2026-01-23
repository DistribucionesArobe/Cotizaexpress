from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime, timedelta, timezone
from config import settings
from database import db
import os
import logging
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

empresas_collection = db.get_collection('empresas')

class PDFService:
    """Servicio para generar PDFs de cotizaciones personalizados"""
    
    def __init__(self):
        self.pdf_dir = '/app/backend/pdfs'
        os.makedirs(self.pdf_dir, exist_ok=True)
    
    async def obtener_empresa_info(self, empresa_id: str) -> dict:
        """Obtiene información de la empresa incluyendo logo"""
        empresa = await empresas_collection.find_one({'id': empresa_id}, {'_id': 0})
        return empresa or {}
    
    async def generar_cotizacion_pdf(self, cotizacion: dict, empresa_id: str = None) -> str:
        """Genera PDF de cotización personalizado con logo de la empresa"""
        try:
            # Obtener info de empresa
            empresa = {}
            if empresa_id or cotizacion.get('empresa_id'):
                empresa = await self.obtener_empresa_info(empresa_id or cotizacion.get('empresa_id'))
            
            # Generar nombre de archivo
            filename = f"cotizacion_{cotizacion['folio']}_{uuid.uuid4().hex[:8]}.pdf"
            filepath = os.path.join(self.pdf_dir, filename)
            
            # Crear documento
            doc = SimpleDocTemplate(
                filepath, 
                pagesize=letter,
                leftMargin=0.75*inch,
                rightMargin=0.75*inch,
                topMargin=0.5*inch,
                bottomMargin=0.5*inch
            )
            story = []
            styles = getSampleStyleSheet()
            
            # Color corporativo (esmeralda como CotizaBot)
            corp_color = colors.HexColor('#059669')
            dark_color = colors.HexColor('#1f2937')
            
            # ============ HEADER CON LOGO ============
            header_data = []
            
            # Logo de la empresa (si existe)
            logo_path = empresa.get('logo_path')
            if logo_path and Path(logo_path).exists():
                try:
                    img = Image(logo_path)
                    # Escalar logo manteniendo proporción (max 1.5 inch altura)
                    img_width = img.drawWidth
                    img_height = img.drawHeight
                    max_height = 1.2 * inch
                    max_width = 2.5 * inch
                    
                    if img_height > max_height:
                        ratio = max_height / img_height
                        img_width = img_width * ratio
                        img_height = max_height
                    
                    if img_width > max_width:
                        ratio = max_width / img_width
                        img_width = img_width * ratio
                        img_height = img_height * ratio
                    
                    img.drawWidth = img_width
                    img.drawHeight = img_height
                    
                    logo_cell = img
                except Exception as e:
                    logger.warning(f"No se pudo cargar logo: {e}")
                    logo_cell = Paragraph(f"<b>{empresa.get('nombre', 'Mi Empresa')}</b>", 
                                         ParagraphStyle('logo', fontSize=18, textColor=corp_color))
            else:
                # Nombre de empresa si no hay logo
                empresa_nombre = empresa.get('nombre', cotizacion.get('empresa_nombre', 'CotizaBot'))
                logo_cell = Paragraph(
                    f"<b>{empresa_nombre}</b>",
                    ParagraphStyle('empresa', fontSize=16, textColor=corp_color, fontName='Helvetica-Bold')
                )
            
            # Info de cotización (lado derecho)
            cotizacion_info = f"""
            <b>COTIZACIÓN</b><br/>
            <font size="10">Folio: {cotizacion['folio']}</font><br/>
            <font size="9">Fecha: {datetime.now(timezone.utc).strftime('%d/%m/%Y')}</font><br/>
            <font size="9">Válida hasta: {cotizacion['valida_hasta'].strftime('%d/%m/%Y')}</font>
            """
            
            info_style = ParagraphStyle(
                'cotizacion_info',
                fontSize=14,
                textColor=dark_color,
                alignment=TA_RIGHT,
                leading=16
            )
            
            header_table = Table(
                [[logo_cell, Paragraph(cotizacion_info, info_style)]],
                colWidths=[4*inch, 3*inch]
            )
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ]))
            
            story.append(header_table)
            story.append(Spacer(1, 0.3*inch))
            
            # Línea divisoria
            story.append(Table([['']], colWidths=[7*inch], rowHeights=[2]))
            story[-1].setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), corp_color),
            ]))
            story.append(Spacer(1, 0.3*inch))
            
            # ============ DATOS DEL CLIENTE ============
            cliente_style = ParagraphStyle('cliente', fontSize=10, textColor=dark_color, leading=14)
            
            cliente_info = f"""
            <b>CLIENTE:</b><br/>
            {cotizacion['cliente_nombre']}<br/>
            Tel: {cotizacion['cliente_telefono']}
            """
            
            empresa_contacto = ""
            if empresa:
                contacto_parts = []
                if empresa.get('telefono'):
                    contacto_parts.append(f"Tel: {empresa['telefono']}")
                if empresa.get('email'):
                    contacto_parts.append(f"Email: {empresa['email']}")
                if empresa.get('direccion'):
                    contacto_parts.append(empresa['direccion'])
                if contacto_parts:
                    empresa_contacto = f"<b>{empresa.get('nombre', '')}</b><br/>" + "<br/>".join(contacto_parts)
            
            if empresa_contacto:
                cliente_table = Table([
                    [Paragraph(cliente_info, cliente_style), Paragraph(empresa_contacto, cliente_style)]
                ], colWidths=[3.5*inch, 3.5*inch])
            else:
                cliente_table = Table([[Paragraph(cliente_info, cliente_style)]], colWidths=[7*inch])
            
            cliente_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f3f4f6')),
                ('PADDING', (0, 0), (-1, -1), 10),
            ]))
            
            story.append(cliente_table)
            story.append(Spacer(1, 0.3*inch))
            
            # ============ TABLA DE PRODUCTOS ============
            productos_data = [['PRODUCTO', 'CANT.', 'UNIDAD', 'P. UNIT.', 'SUBTOTAL']]
            
            for item in cotizacion['items']:
                productos_data.append([
                    item['producto_nombre'][:40],  # Truncar nombres largos
                    str(item['cantidad']),
                    item.get('unidad', 'PZA'),
                    f"${item['precio_unitario']:,.2f}",
                    f"${item['subtotal']:,.2f}"
                ])
            
            productos_table = Table(
                productos_data, 
                colWidths=[2.8*inch, 0.6*inch, 0.7*inch, 1*inch, 1*inch]
            )
            productos_table.setStyle(TableStyle([
                # Header
                ('BACKGROUND', (0, 0), (-1, 0), corp_color),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('TOPPADDING', (0, 0), (-1, 0), 10),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                
                # Filas de datos
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
                ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                
                # Bordes
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
                ('LINEBELOW', (0, 0), (-1, 0), 2, corp_color),
                
                # Filas alternadas
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            ]))
            
            story.append(productos_table)
            story.append(Spacer(1, 0.2*inch))
            
            # ============ TOTALES ============
            totales_data = [
                ['', 'Subtotal:', f"${cotizacion['subtotal']:,.2f} MXN"],
                ['', 'IVA (16%):', f"${cotizacion['iva']:,.2f} MXN"],
                ['', 'TOTAL:', f"${cotizacion['total']:,.2f} MXN"]
            ]
            
            totales_table = Table(
                totales_data, 
                colWidths=[4*inch, 1.5*inch, 1.5*inch]
            )
            totales_table.setStyle(TableStyle([
                ('FONTNAME', (1, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (1, 0), (-1, 1), 10),
                ('FONTSIZE', (1, 2), (-1, 2), 12),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('TEXTCOLOR', (1, 2), (-1, 2), corp_color),
                ('LINEABOVE', (1, 2), (-1, 2), 2, corp_color),
                ('TOPPADDING', (1, 2), (-1, 2), 8),
            ]))
            
            story.append(totales_table)
            
            # ============ NOTAS ============
            if cotizacion.get('notas'):
                story.append(Spacer(1, 0.3*inch))
                notas_style = ParagraphStyle(
                    'notas', 
                    fontSize=9, 
                    textColor=colors.HexColor('#6b7280'),
                    leading=12
                )
                story.append(Paragraph(f"<b>Notas:</b> {cotizacion['notas']}", notas_style))
            
            # ============ FOOTER ============
            story.append(Spacer(1, 0.5*inch))
            
            footer_style = ParagraphStyle(
                'footer',
                fontSize=8,
                textColor=colors.HexColor('#9ca3af'),
                alignment=TA_CENTER
            )
            
            footer_text = "Cotización generada por CotizaBot • cotizaexpress.com"
            if empresa.get('nombre'):
                footer_text = f"Cotización generada para {empresa['nombre']} por CotizaBot • cotizaexpress.com"
            
            story.append(Paragraph(footer_text, footer_style))
            
            # Construir PDF
            doc.build(story)
            
            logger.info(f"PDF generado con logo: {filename}")
            
            return filepath
            
        except Exception as e:
            logger.error(f"Error generando PDF: {str(e)}")
            raise

pdf_service = PDFService()
