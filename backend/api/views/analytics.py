from django.db.models import Q, Sum
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Proyecto, Sprint, HistoriaUsuario
from ..permissions import IsProjectMember

class AnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet para métricas y analítica avanzada del proyecto.
    """
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]

    @action(detail=True, methods=['get'])
    def project_dashboard(self, request, pk=None):
        try:
            proyecto = Proyecto.objects.get(pk=pk)
        except Proyecto.DoesNotExist:
            return Response({'error': 'Proyecto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # Verificar permisos (IsProjectMember ya lo hace pero por si acaso)
        self.check_object_permissions(request, proyecto)

        sprints = Sprint.objects.filter(proyecto=proyecto, estado='terminado').order_by('fecha_inicio')
        
        # Velocidad Promedio (Story Points o Historias completadas)
        # Usaremos conteo de historias terminadas por sprint como métrica base de velocidad
        velocidad_por_sprint = []
        for s in sprints:
            completadas = HistoriaUsuario.objects.filter(sprint=s, estado='terminado').count()
            velocidad_por_sprint.append({
                'sprint': s.nombre,
                'completadas': completadas,
                'puntos': float(HistoriaUsuario.objects.filter(sprint=s, estado='terminado').aggregate(Sum('horas_estimadas'))['horas_estimadas__sum'] or 0)
            })

        velocidad_promedio = sum([v['completadas'] for v in velocidad_por_sprint]) / len(sprints) if sprints.exists() else 0
        puntos_promedio = sum([v['puntos'] for v in velocidad_por_sprint]) / len(sprints) if sprints.exists() else 0

        # Capacidad y Cumplimiento del Sprint Actual
        sprint_actual = Sprint.objects.filter(proyecto=proyecto, estado='activo').first()
        actual_stats = {}
        if sprint_actual:
            total_hu = HistoriaUsuario.objects.filter(sprint=sprint_actual).count()
            terminadas_hu = HistoriaUsuario.objects.filter(sprint=sprint_actual, estado='terminado').count()
            puntos_totales = float(HistoriaUsuario.objects.filter(sprint=sprint_actual).aggregate(Sum('horas_estimadas'))['horas_estimadas__sum'] or 0)
            puntos_terminados = float(HistoriaUsuario.objects.filter(sprint=sprint_actual, estado='terminado').aggregate(Sum('horas_estimadas'))['horas_estimadas__sum'] or 0)
            
            actual_stats = {
                'nombre': sprint_actual.nombre,
                'total_hu': total_hu,
                'terminadas_hu': terminadas_hu,
                'puntos_totales': puntos_totales,
                'puntos_terminados': puntos_terminados,
                'porcentaje_cumplimiento': (terminadas_hu / total_hu * 100) if total_hu > 0 else 0
            }

        return Response({
            'velocidad_promedio_hu': round(velocidad_promedio, 2),
            'velocidad_promedio_puntos': round(puntos_promedio, 2),
            'tendencia_velocidad': velocidad_por_sprint,
            'sprint_actual': actual_stats,
            'total_historias_proyecto': HistoriaUsuario.objects.filter(proyecto=proyecto).count(),
            'total_puntos_proyecto': float(HistoriaUsuario.objects.filter(proyecto=proyecto).aggregate(Sum('horas_estimadas'))['horas_estimadas__sum'] or 0)
        })
