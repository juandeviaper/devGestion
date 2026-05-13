from rest_framework import viewsets, permissions
from ..models import CeremoniaScrum
from ..serializers import CeremoniaSerializer
from ..permissions import IsProjectMember

class CeremoniaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar ceremonias de Scrum.
    """
    serializer_class = CeremoniaSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]

    def get_queryset(self):
        proyecto_id = self.request.query_params.get('proyecto')
        if proyecto_id:
            return CeremoniaScrum.objects.filter(proyecto_id=proyecto_id)
        return CeremoniaScrum.objects.filter(proyecto__miembros__usuario=self.request.user).distinct()

    def perform_create(self, serializer):
        serializer.save()
