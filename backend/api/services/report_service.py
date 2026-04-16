import io
from datetime import timedelta
from django.db.models import Sum
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
import os
from django.conf import settings
from ..models import Proyecto, HistoriaUsuario, Tarea, Bug, Sprint

class ReportService:
    """
    Servicio para la generación de reportes y métricas de SCRUM.
    """

    @staticmethod
    def get_project_stats(project_id):
        project = Proyecto.objects.get(id=project_id)
        stories = HistoriaUsuario.objects.filter(proyecto=project)
        
        total_estimado = stories.aggregate(Sum('horas_estimadas'))['horas_estimadas__sum'] or 0
        total_real = stories.aggregate(Sum('horas_reales'))['horas_reales__sum'] or 0
        
        stories_done = stories.filter(estado='terminado').count()
        total_stories = stories.count()
        
        progreso = (stories_done / total_stories * 100) if total_stories > 0 else 0
        
        return {
            "nombre": project.nombre,
            "total_estimado": float(total_estimado),
            "total_real": float(total_real),
            "progreso": progreso,
            "stories_total": total_stories,
            "stories_done": stories_done,
            "costo_estimado": float(total_estimado * 50), # Asumiendo $50/hr
            "costo_real": float(total_real * 50)
        }

    @staticmethod
    def generate_project_pdf(project_id):
        stats = ReportService.get_project_stats(project_id)
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        styles = getSampleStyleSheet()
        
        # Estilos Corporativos DevGestión
        title_style = styles['Title']
        title_style.textColor = colors.HexColor('#0F172A')
        title_style.fontSize = 24
        title_style.fontName = 'Helvetica-Bold'
        title_style.alignment = 0 # Left align
        title_style.spaceAfter = 10
        
        subtitle_style = styles['Normal']
        subtitle_style.textColor = colors.HexColor('#64748B')
        subtitle_style.fontSize = 12
        subtitle_style.fontName = 'Helvetica'
        subtitle_style.spaceAfter = 30
        
        elements = []

        # Intentar cargar y anexar logo
        try:
            logo_path = os.path.normpath(os.path.join(settings.BASE_DIR, '..', 'frontend', 'public', 'logo.png'))
            if os.path.exists(logo_path):
                logo = Image(logo_path, width=120, height=40)
                logo.hAlign = 'LEFT'
                elements.append(logo)
        except Exception:
            pass # Falla silenciosa si no se encuentra la imagen

        # Título
        elements.append(Paragraph(f"Reporte de Desempeño", subtitle_style))
        elements.append(Paragraph(f"{stats['nombre']}", title_style))
        
        elements.append(Spacer(1, 10))

        # Resumen Ejecutivo
        data = [
            ["Métrica de Evaluación", "Resultado"],
            ["Historias Totales", str(stats['stories_total'])],
            ["Historias Completadas", str(stats['stories_done'])],
            ["Progreso General", f"{stats['progreso']:.1f}%"],
            ["Horas Estimadas Totales", f"{stats['total_estimado']} hrs"],
            ["Horas Reales Invertidas", f"{stats['total_real']} hrs"],
            ["Costo Real Estimado ($50/hr)", f"${stats['costo_real']:.2f}"]
        ]

        t = Table(data, colWidths=[300, 150])
        t.setStyle(TableStyle([
            # Encabezado (Emerald)
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 14),
            ('TOPPADDING', (0, 0), (-1, 0), 14),
            
            # Filas de datos
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1A1A1A')),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'), # Nombres en negrita
            ('FONTNAME', (1, 1), (1, -1), 'Helvetica'), # Valores en normal
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 12),
            ('TOPPADDING', (0, 1), (-1, -1), 12),
            
            # Rejilla sutil
            ('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor('#E9ECEF')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 40))

        # Nota final
        footer_style = styles['Italic']
        footer_style.textColor = colors.HexColor('#ADB5BD')
        footer_style.fontSize = 9
        footer_style.alignment = 1 # Center
        elements.append(Paragraph("Este documento fue generado automáticamente por el motor de inteligencia de DevGestión.", footer_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer
