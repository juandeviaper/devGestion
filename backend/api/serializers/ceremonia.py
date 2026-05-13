from rest_framework import serializers
from ..models import CeremoniaScrum
from .user import UserSerializer

class CeremoniaSerializer(serializers.ModelSerializer):
    participantes_detalle = UserSerializer(source='participantes', many=True, read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = CeremoniaScrum
        fields = [
            'id', 'tipo', 'tipo_display', 'fecha', 'notas', 'reunion_url', 'estado', 
            'estado_display', 'proyecto', 'sprint', 'participantes', 
            'participantes_detalle', 'fecha_creacion'
        ]
        read_only_fields = ['fecha_creacion']
