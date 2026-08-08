import io
import os
from datetime import datetime
from sqlmodel import Session, select
from fastapi import HTTPException

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

# PyPDF import for merging
try:
    from pypdf import PdfWriter, PdfReader
except ImportError:
    # Fallback si usan PyPDF2 (aunque pypdf es la moderna)
    from PyPDF2 import PdfWriter, PdfReader

from app.Modules.vehiculos.model import Vehiculo, EtapaVehiculo
from app.Modules.documentos.model import DocumentoVehiculo, TipoDocumento

UPLOAD_DIR = "documentos"

class LegajoService:
    def __init__(self, session: Session):
        self.session = session

    def generar_legajo_completo_pdf(self, vehiculo_id: int) -> io.BytesIO:
        # 1. Obtener vehículo
        vehiculo = self.session.get(Vehiculo, vehiculo_id)
        if not vehiculo:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")

        # 2. Obtener documentos del vehículo (ordenados por fecha o etapa)
        statement = select(DocumentoVehiculo).where(
            DocumentoVehiculo.vehiculo_id == vehiculo_id
        ).order_by(DocumentoVehiculo.fecha_subida)
        documentos = self.session.exec(statement).all()

        # 3. Generar Carátula en memoria (BytesIO)
        caratula_io = io.BytesIO()
        self._generar_caratula(caratula_io, vehiculo, documentos)
        caratula_io.seek(0)

        # 4. Concatenar Carátula con los PDFs físicos
        merger = PdfWriter()
        
        # Añadir carátula
        merger.append(caratula_io)

        # Ordenar etapas lógicamente
        orden_etapas = [
            EtapaVehiculo.pre_compra,
            EtapaVehiculo.comprado,
            EtapaVehiculo.en_stock,
            EtapaVehiculo.vendido
        ]

        for etapa in orden_etapas:
            docs_etapa = [d for d in documentos if d.etapa == etapa]
            for doc in docs_etapa:
                # Extraer nombre del archivo de la ruta (/documentos/filename.pdf)
                filename = doc.ruta_archivo.replace("/documentos/", "")
                filepath = os.path.join(UPLOAD_DIR, filename)
                
                if os.path.exists(filepath) and filepath.lower().endswith('.pdf'):
                    try:
                        merger.append(filepath)
                    except Exception as e:
                        print(f"Error al adjuntar {filepath}: {e}")
                        # Continuamos aunque falle un archivo en particular

        # 5. Escribir resultado final
        output_io = io.BytesIO()
        merger.write(output_io)
        merger.close()
        caratula_io.close()
        
        output_io.seek(0)
        return output_io

    def _generar_caratula(self, buffer: io.BytesIO, vehiculo: Vehiculo, documentos: list[DocumentoVehiculo]):
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=inch, leftMargin=inch,
            topMargin=inch, bottomMargin=inch
        )
        
        styles = getSampleStyleSheet()
        
        # Estilos personalizados
        title_style = ParagraphStyle(
            'TitleCustom',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#4f46e5'), # Indigo/Primary
            alignment=1 # Center
        )
        
        subtitle_style = ParagraphStyle(
            'SubtitleCustom',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.HexColor('#374151') # Gray 700
        )

        normal_style = styles['Normal']
        
        elements = []

        # Título
        elements.append(Paragraph("AutoLead CRM", title_style))
        elements.append(Paragraph("Legajo Digital Consolidado", subtitle_style))
        elements.append(Spacer(1, 0.2 * inch))

        # Datos del Vehículo
        datos = [
            ["ID Vehículo:", f"#{vehiculo.id}", "Fecha Emisión:", datetime.now().strftime("%d/%m/%Y %H:%M")],
            ["Marca/Modelo:", f"{vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})", "Patente:", vehiculo.patente.upper() if vehiculo.patente else "N/A"],
            ["Condición:", vehiculo.condicion.capitalize(), "Estado:", vehiculo.estado.capitalize()],
            ["Kilometraje:", f"{vehiculo.kilometraje:,} km", "Precio:", f"${vehiculo.precio_compra:,.2f}" if vehiculo.precio_compra else "N/A"]
        ]
        
        t_datos = Table(datos, colWidths=[1.5*inch, 2*inch, 1.5*inch, 1.5*inch])
        t_datos.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ]))
        
        elements.append(t_datos)
        elements.append(Spacer(1, 0.4 * inch))

        # Índice de Documentos
        elements.append(Paragraph("Índice de Documentación Oficial", subtitle_style))
        
        doc_data = [["Etapa", "Documento", "Estado", "Fecha/Versión"]]
        
        orden_etapas = [
            (EtapaVehiculo.pre_compra, "Pre-compra"),
            (EtapaVehiculo.comprado, "Comprado"),
            (EtapaVehiculo.en_stock, "En Stock"),
            (EtapaVehiculo.vendido, "Vendido")
        ]
        
        # Mapeo de labels para los tipos de documento
        from app.Modules.documentos.model import TipoDocumento
        labels_tipo = {
            "informe_dominio": "Informe de Dominio",
            "deuda_patentes": "Deuda de Patentes",
            "boleto_compra": "Boleto de Compra",
            "dni_vendedor": "DNI Vendedor",
            "cedula_vehiculo": "Cédula Vehículo",
            "formulario_08": "Formulario 08",
            "contrato_consignacion": "Contrato Consignación",
            "boleto_venta": "Boleto de Venta",
            "verificacion_policial": "Verificación Policial",
            "dni_comprador": "DNI Comprador",
            "formulario_08_12": "Formulario 08/12",
            "factura_venta": "Factura Venta",
            "circuito_plata": "Circuito Plata"
        }

        for etapa_enum, etapa_nombre in orden_etapas:
            docs_en_etapa = [d for d in documentos if d.etapa == etapa_enum]
            
            if docs_en_etapa:
                for d in docs_en_etapa:
                    label = labels_tipo.get(d.tipo_documento.value, d.tipo_documento.value)
                    fecha_str = d.fecha_subida.strftime("%d/%m/%Y") if d.fecha_subida else "N/A"
                    estado_str = "Cargado"
                    detalle = f"v{d.version} ({fecha_str})"
                    doc_data.append([etapa_nombre, label, estado_str, detalle])
            else:
                doc_data.append([etapa_nombre, "Sin documentos cargados", "-", "-"])
                
        t_docs = Table(doc_data, colWidths=[1.2*inch, 2.5*inch, 1*inch, 1.8*inch])
        t_docs.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4f46e5')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#ffffff')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('ALIGN', (2, 1), (2, -1), 'CENTER'),
            ('ALIGN', (3, 1), (3, -1), 'CENTER'),
        ]))
        
        elements.append(t_docs)
        
        elements.append(Spacer(1, 0.4 * inch))
        
        nota_style = ParagraphStyle(
            'NotaCustom',
            parent=styles['Italic'],
            fontSize=10,
            textColor=colors.HexColor('#6b7280') # Gray 500
        )
        elements.append(Paragraph(
            "Nota: Las páginas siguientes corresponden a las copias fieles de los documentos digitales respaldatorios adjuntos a este vehículo, en el orden listado en el índice anterior.", 
            nota_style
        ))

        doc.build(elements)
