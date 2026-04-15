from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Bug
from ..permissions import (
    IsProjectMember,
    IsOwnerOrAdminToCreateUpdate,
    CanUpdateStatusIfAssigned,
)
from ..serializers import BugSerializer


class BugViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Bugs.
    Maneja la resolución de claves foráneas de forma eficiente.
    """

    serializer_class = BugSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsOwnerOrAdminToCreateUpdate | CanUpdateStatusIfAssigned,
    ]

    def get_queryset(self):
        user = self.request.user
        queryset = Bug.objects.select_related('proyecto', 'asignado_a', 'historia').all()

        historia_id = self.request.query_params.get('historia')
        proyecto_id = self.request.query_params.get('proyecto')

        if historia_id:
            queryset = queryset.filter(historia_id=historia_id)
        if proyecto_id:
            queryset = queryset.filter(proyecto_id=proyecto_id)

        if not user.is_staff:
            queryset = queryset.filter(
                Q(proyecto__creador=user) | Q(proyecto__miembros__usuario=user) | Q(asignado_a=user)
            ).distinct()

        return queryset

    @action(detail=True, methods=['patch'])
    def change_status(self, request, pk=None):
        """
        Actualiza el estado de un bug.
        """
        bug = self.get_object()
        new_status = request.data.get('estado')
        if not new_status:
            return Response({'error': 'Falta el nuevo estado'}, status=status.HTTP_400_BAD_REQUEST)

        bug.estado = new_status
        bug.save()
        return Response(self.get_serializer(bug).data)
