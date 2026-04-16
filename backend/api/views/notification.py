from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Notification
from ..serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de notificaciones del usuario autenticado.
    Solo expone las notificaciones propias del usuario.
    """

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def permission_denied(self, request, message=None, code=None):
        from rest_framework import exceptions
        raise exceptions.PermissionDenied(detail={"error": message or "No tienes permisos para gestionar estas notificaciones"})

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notificación leída'})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'todas las notificaciones leídas'})
