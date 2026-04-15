from rest_framework import serializers

from ..models import Bug
from .user import UserSerializer


# Serializadores del dominio de Bugs


class BugSerializer(serializers.ModelSerializer):
    asignado_a_detalle = UserSerializer(source='asignado_a', read_only=True)

    class Meta:
        model = Bug
        fields = [
            'id',
            'titulo',
            'descripcion',
            'prioridad',
            'estado',
            'fecha_creacion',
            'proyecto',
            'historia',
            'asignado_a',
            'asignado_a_detalle',
            'horas_estimadas',
            'horas_reales',
        ]
        read_only_fields = ['fecha_creacion']
