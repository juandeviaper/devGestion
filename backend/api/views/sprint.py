from django.db.models import Q
from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Sprint
from ..permissions import IsProjectMember, IsProjectOwner
from ..serializers import SprintSerializer


class SprintViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de Sprints.
    """

    serializer_class = SprintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """
        Todos los miembros del proyecto pueden gestionar sprints (CRUD + iniciar/finalizar).
        El queryset ya filtra que solo ven sprints de sus proyectos.
        """
        return [permissions.IsAuthenticated(), IsProjectMember()]

    def get_queryset(self):
        proyecto_id = self.request.query_params.get('proyecto')
        user = self.request.user
        if proyecto_id:
            return (
                Sprint.objects.filter(proyecto_id=proyecto_id)
                .filter(Q(proyecto__creador=user) | Q(proyecto__miembros__usuario=user))
                .distinct()
            )

        return Sprint.objects.filter(
            Q(proyecto__creador=user) | Q(proyecto__miembros__usuario=user)
        ).distinct()

    def perform_destroy(self, instance):
        if instance.estado == 'activo':
            from rest_framework.exceptions import ValidationError
            raise ValidationError("No se puede eliminar un Sprint que está actualmente activo.")
        instance.delete()

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """
        Inicia el sprint. Solo puede haber un sprint activo por proyecto.
        """
        sprint = self.get_object()
        
        # Verificar si ya hay un sprint activo en el proyecto
        p_activo = Sprint.objects.filter(proyecto=sprint.proyecto, estado='activo').exists()
        if p_activo:
            return Response(
                {"error": "Ya existe un sprint activo en este proyecto. Finalízalo antes de iniciar uno nuevo."},
                status=status.HTTP_400_BAD_REQUEST
            )

        sprint.estado = 'activo'
        sprint.save()
        return Response({"message": f"Sprint '{sprint.nombre}' iniciado correctamente.", "estado": sprint.estado})

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """
        Finaliza el sprint.
        """
        sprint = self.get_object()
        sprint.estado = 'terminado'
        sprint.save()
        return Response({"message": f"Sprint '{sprint.nombre}' finalizado correctamente.", "estado": sprint.estado})
