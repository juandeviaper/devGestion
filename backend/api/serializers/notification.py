from rest_framework import serializers

from ..models import Notification


# Serializador del dominio de Notificaciones


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Notification.
    Solo lectura sobre el campo `user` para evitar suplantación.
    """

    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'link', 'is_read', 'created_at']
        read_only_fields = ['user', 'created_at']
