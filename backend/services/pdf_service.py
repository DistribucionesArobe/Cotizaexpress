from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from datetime import datetime, timedelta, timezone
from config import settings
import os
import logging
import uuid

logger = logging.getLogger(__name__)

class PDFService:
    """Servicio para generar PDFs de cotizaciones"""
    
    def __init__(self):
        self.pdf_dir = '/app/backend/pdfs'
        os.makedirs(self.pdf_dir, exist_ok=True)
    
    async def generar_cotizacion_pdf(self, cotizacion: dict) -> str:
        """Genera PDF de cotización y devuelve la ruta del archivo"""
        try:
            # Generar nombre de archivo
            filename = f"cotizacion_{cotizacion['folio']}_{uuid.uuid4().hex[:8]}.pdf"
            filepath = os.path.join(self.pdf_dir, filename)
            
            # Crear documento
            doc = SimpleDocTemplate(filepath, pagesize=letter)
            story = []
            styles = getSampleStyleSheet()
            
            # Estilos personalizados
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1a5490'),
                alignment=TA_CENTER,
                spaceAfter=30
            )
            
            # Título
            story.append(Paragraph("COTIZACIÓN", title_style))
            story.append(Spacer(1, 0.2*inch))
            
            # Información general
            info_data = [
                ['Folio:', cotizacion['folio']],
                ['Cliente:', cotizacion['cliente_nombre']],
                ['Teléfono:', cotizacion['cliente_telefono']],
                ['Fecha:', datetime.now(timezone.utc).strftime('%d/%m/%Y')],
                ['Válida hasta:', cotizacion['valida_hasta'].strftime('%d/%m/%Y')]
            ]
            
            info_table = Table(info_data, colWidths=[2*inch, 4*inch])
            info_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#333333')),
                ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
            ]))
            
            story.append(info_table)
            story.append(Spacer(1, 0.3*inch))
            
            # Tabla de productos
            productos_data = [['Producto', 'Cant.', 'Unidad', 'Precio Unit.', 'Subtotal']]
            
            for item in cotizacion['items']:
                productos_data.append([
                    item['producto_nombre'],
                    str(item['cantidad']),
                    item['unidad'],
                    f"${item['precio_unitario']:.2f}",
                    f"${item['subtotal']:.2f}"
                ])
            
            productos_table = Table(productos_data, colWidths=[2.5*inch, 0.7*inch, 0.8*inch, 1*inch, 1*inch])
            productos_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
            ]))
            
            story.append(productos_table)
            story.append(Spacer(1, 0.3*inch))
            
            # Totales
            totales_data = [
                ['Subtotal:', f"${cotizacion['subtotal']:.2f} MXN"],
                ['IVA (16%):', f"${cotizacion['iva']:.2f} MXN"],
                ['TOTAL:', f"${cotizacion['total']:.2f} MXN"]
            ]
            
            totales_table = Table(totales_data, colWidths=[4.5*inch, 1.5*inch])
            totales_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 1), 10),
                ('FONTSIZE', (0, 2), (-1, 2), 12),
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                ('TEXTCOLOR', (0, 2), (-1, 2), colors.HexColor('#1a5490')),
                ('LINEABOVE', (0, 2), (-1, 2), 2, colors.HexColor('#1a5490'))
            ]))
            
            story.append(totales_table)
            
            # Notas
            if cotizacion.get('notas'):
                story.append(Spacer(1, 0.3*inch))
                story.append(Paragraph(f"<b>Notas:</b> {cotizacion['notas']}", styles['Normal']))
            
            # Construir PDF
            doc.build(story)
            
            logger.info(f"PDF generado: {filename}")
            
            return filepath
            
        except Exception as e:
            logger.error(f"Error generando PDF: {str(e)}")
            raise

pdf_service = PDFService()