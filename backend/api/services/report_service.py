import io
from datetime import timedelta
from django.db.models import Sum
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
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
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Título
        elements.append(Paragraph(f"Reporte de Estado: {stats['nombre']}", styles['Title']))
        elements.append(Spacer(1, 12))

        # Resumen Ejecutivo
        data = [
            ["Métrica", "Valor"],
            ["Historias Totales", stats['stories_total']],
            ["Historias Completadas", stats['stories_done']],
            ["Progreso General", f"{stats['progreso']:.1f}%"],
            ["Horas Estimadas Totales", f"{stats['total_estimado']} hrs"],
            ["Horas Reales Invertidas", f"{stats['total_real']} hrs"],
            ["Costo Real Estimado ($50/hr)", f"${stats['costo_real']:.2f}"]
        ]

        t = Table(data, colWidths=[200, 200])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.black),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(t)
        elements.append(Spacer(1, 24))

        # Nota final
        elements.append(Paragraph("Este reporte fue generado automáticamente por DevGestión.", styles['Italic']))

        doc.build(elements)
        buffer.seek(0)
        return buffer
