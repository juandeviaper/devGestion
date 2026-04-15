from rest_framework import serializers

from ..models import Tarea
from .user import UserSerializer


# Serializadores del dominio de Tareas


class TareaSerializer(serializers.ModelSerializer):
    asignado_a_detalle = UserSerializer(source='asignado_a', read_only=True)

    class Meta:
        model = Tarea
        fields = [
            'id',
            'titulo',
            'descripcion',
            'prioridad',
            'estado',
            'fecha_creacion',
            'historia',
            'proyecto',
            'asignado_a',
            'asignado_a_detalle',
            'horas_estimadas',
            'horas_reales',
        ]
        read_only_fields = ['fecha_creacion']
