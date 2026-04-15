from rest_framework import serializers

from ..models import Proyecto, Sprint


# Serializadores del dominio de Sprints


class SlimProyectoSerializer(serializers.ModelSerializer):
    """
    Representación reducida del Proyecto para uso como campo anidado en Sprint.
    Evita cargar todos los campos y la cadena de dependencias de ProyectoSerializer.
    """

    class Meta:
        model = Proyecto
        fields = ['id', 'nombre', 'estado', 'visibilidad']


class SprintSerializer(serializers.ModelSerializer):
    """
    Serializador enriquecido para Sprints con detalle básico del proyecto.
    """

    proyecto_detalle = SlimProyectoSerializer(source='proyecto', read_only=True)

    class Meta:
        model = Sprint
        fields = [
            'id',
            'nombre',
            'objetivo',
            'fecha_inicio',
            'fecha_fin',
            'estado',
            'proyecto',
            'proyecto_detalle',
            'color',
        ]
