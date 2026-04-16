from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Adjunto, Comentario, CriterioAceptacion, Epica, HistoriaUsuario
from ..permissions import (
    CanUpdateStatusIfAssigned,
    IsOwnerOrAdminToCreateUpdate,
    IsProjectMember,
)
from ..serializers import (
    AdjuntoSerializer,
    ComentarioSerializer,
    CriterioAceptacionSerializer,
    EpicaSerializer,
    HistoriaUsuarioSerializer,
)


class EpicaViewSet(viewsets.ModelViewSet):
    serializer_class = EpicaSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]

    def get_queryset(self):
        user = self.request.user
        queryset = Epica.objects.select_related('proyecto').all()
        proyecto_id = self.request.query_params.get('proyecto')
        if proyecto_id:
            queryset = queryset.filter(proyecto_id=proyecto_id)

        return queryset.filter(
            Q(proyecto__creador=user) | Q(proyecto__miembros__usuario=user) | Q(proyecto__visibilidad='publico')
        ).distinct()


class HistoriaUsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = HistoriaUsuarioSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        # Crear: cualquier miembro. Editar/Eliminar: solo dueños.
        # Actualizar estado (PATCH): el asignado puede hacerlo.
        IsOwnerOrAdminToCreateUpdate | CanUpdateStatusIfAssigned,
    ]

    def permission_denied(self, request, message=None, code=None):
        from rest_framework import exceptions
        if request.authenticators and not request.successful_authenticator:
            raise exceptions.NotAuthenticated()
        
        # Formato solicitado: {"error": "..."}
        error_message = message or "No tienes permiso para modificar esta historia"
        raise exceptions.PermissionDenied(detail={"error": error_message})

    def get_queryset(self):
        user = self.request.user
        queryset = (
            HistoriaUsuario.objects.select_related('proyecto', 'epica', 'sprint', 'asignado_a')
            .prefetch_related('criterios')
            .all()
        )

        proyecto_id = self.request.query_params.get('proyecto')
        sprint_id = self.request.query_params.get('sprint')

        if proyecto_id:
            queryset = queryset.filter(proyecto_id=proyecto_id)
        if sprint_id:
            queryset = queryset.filter(sprint_id=sprint_id)

        if not user.is_staff:
            # Cualquier miembro del proyecto (dueño o colaborador) puede ver todas las historias
            # Al igual que cualquier usuario si el proyecto es público
            queryset = queryset.filter(
                Q(proyecto__creador=user)
                | Q(proyecto__miembros__usuario=user)
                | Q(proyecto__visibilidad='publico')
            ).distinct()
        return queryset

    @action(detail=False, methods=['post'], url_path='import')
    def import_stories(self, request):
        """
        Endpoint para carga masiva de historias desde Excel.
        """
        from ..services.excel_import_service import ExcelImportService
        from ..models import Proyecto

        proyecto_id = request.data.get('proyecto')
        file_obj = request.FILES.get('file')

        if not proyecto_id or not file_obj:
            return Response(
                {'error': 'Falta el ID del proyecto o el archivo Excel.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar permisos sobre el proyecto (cualquier miembro puede importar)
        try:
            proyecto = Proyecto.objects.get(id=proyecto_id)
            if not request.user.is_staff and proyecto.creador != request.user:
                from ..models import ProyectoMiembro
                if not ProyectoMiembro.objects.filter(
                    proyecto=proyecto, usuario=request.user
                ).exists():
                    return Response(
                        {'error': 'No eres miembro de este proyecto.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        except Proyecto.DoesNotExist:
            return Response({'error': 'El proyecto no existe.'}, status=status.HTTP_404_NOT_FOUND)

        result = ExcelImportService.import_user_stories(proyecto_id, file_obj)
        
        if not result['success']:
            return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(result['data'], status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def change_status(self, request, pk=None):
        """
        Actualiza el estado de una historia de usuario.
        """
        story = self.get_object()
        new_status = request.data.get('estado')
        if not new_status:
            return Response({'error': 'Falta el nuevo estado'}, status=status.HTTP_400_BAD_REQUEST)

        story.estado = new_status
        story.save()
        return Response(self.get_serializer(story).data)


class CriterioAceptacionViewSet(viewsets.ModelViewSet):
    queryset = CriterioAceptacion.objects.all()
    serializer_class = CriterioAceptacionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdminToCreateUpdate]

    def permission_denied(self, request, message=None, code=None):
        from rest_framework import exceptions
        raise exceptions.PermissionDenied(detail={"error": message or "No tienes permiso para modificar este criterio"})


class ComentarioViewSet(viewsets.ModelViewSet):
    serializer_class = ComentarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdminToCreateUpdate]

    def permission_denied(self, request, message=None, code=None):
        from rest_framework import exceptions
        raise exceptions.PermissionDenied(detail={"error": message or "No tienes permiso para gestionar este comentario"})

    def get_queryset(self):
        user = self.request.user
        return (
            Comentario.objects.select_related('usuario', 'proyecto', 'historia')
            .filter(
                Q(proyecto__creador=user)
                | Q(proyecto__miembros__usuario=user)
                | Q(proyecto__visibilidad='publico')
                | Q(historia__proyecto__creador=user)
                | Q(historia__proyecto__miembros__usuario=user)
                | Q(historia__proyecto__visibilidad='publico')
            )
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class AdjuntoViewSet(viewsets.ModelViewSet):
    serializer_class = AdjuntoSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdminToCreateUpdate]

    def permission_denied(self, request, message=None, code=None):
        from rest_framework import exceptions
        raise exceptions.PermissionDenied(detail={"error": message or "No tienes permiso para gestionar este adjunto"})

    def get_queryset(self):
        user = self.request.user
        return (
            Adjunto.objects.select_related('subido_por', 'historia')
            .filter(
                Q(historia__proyecto__creador=user) 
                | Q(historia__proyecto__miembros__usuario=user)
                | Q(historia__proyecto__visibilidad='publico')
            )
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(subido_por=self.request.user)
