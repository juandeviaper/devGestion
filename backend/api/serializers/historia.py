from rest_framework import serializers

from ..models import Adjunto, Comentario, CriterioAceptacion, Epica, HistoriaUsuario
from .user import UserSerializer


# Serializadores del dominio de Historias de Usuario


class CriterioAceptacionSerializer(serializers.ModelSerializer):
    historia = serializers.PrimaryKeyRelatedField(read_only=True, required=False)

    class Meta:
        model = CriterioAceptacion
        fields = ['id', 'descripcion', 'completado', 'historia']


class ComentarioSerializer(serializers.ModelSerializer):
    usuario_detalle = UserSerializer(source='usuario', read_only=True)

    class Meta:
        model = Comentario
        fields = [
            'id',
            'contenido',
            'fecha_creacion',
            'usuario',
            'usuario_detalle',
            'historia',
            'proyecto',
        ]
        read_only_fields = ['fecha_creacion']


class AdjuntoSerializer(serializers.ModelSerializer):
    subido_por_detalle = UserSerializer(source='subido_por', read_only=True)

    class Meta:
        model = Adjunto
        fields = [
            'id',
            'nombre_archivo',
            'url_archivo',
            'tipo_archivo',
            'fecha_subida',
            'historia',
            'subido_por',
            'subido_por_detalle',
        ]
        read_only_fields = ['fecha_subida']


class EpicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Epica
        fields = '__all__'


class HistoriaUsuarioSerializer(serializers.ModelSerializer):
    criterios = CriterioAceptacionSerializer(many=True, required=False)
    comentarios_count = serializers.IntegerField(source='comentarios.count', read_only=True)
    adjuntos_count = serializers.IntegerField(source='adjuntos.count', read_only=True)
    asignado_a_detalle = UserSerializer(source='asignado_a', read_only=True)

    class Meta:
        model = HistoriaUsuario
        fields = [
            'id',
            'titulo',
            'descripcion',
            'prioridad',
            'estado',
            'epica',
            'sprint',
            'proyecto',
            'asignado_a',
            'asignado_a_detalle',
            'horas_estimadas',
            'horas_reales',
            'fecha_creacion',
            'criterios',
            'comentarios_count',
            'adjuntos_count',
        ]
        read_only_fields = ['fecha_creacion']

    def to_internal_value(self, data):
        # Convertir strings vacíos a None para claves foráneas opcionales
        for field in ['epica', 'sprint', 'asignado_a']:
            if field in data and data[field] == '':
                data[field] = None
        return super().to_internal_value(data)

    def validate(self, data):
        # Validación universal de asignación de Sprint (Previene modificaciones prohibidas via API pura)
        if 'sprint' in data:
            new_sprint = data.get('sprint')
            # Bypass si es un UPDATE y solo estamos re-guardando en el mismo sprint
            if self.instance and self.instance.sprint == new_sprint:
                pass
            elif new_sprint:
                if new_sprint.estado == 'activo':
                    raise serializers.ValidationError({"sprint": "No se pueden agregar historias a un sprint en curso."})
                elif new_sprint.estado == 'terminado':
                    raise serializers.ValidationError({"sprint": "No se pueden asignar historias a un sprint cerrado."})
        return data

    def create(self, validated_data):
        from ..services.workitem_service import WorkItemService

        criterios_data = validated_data.pop('criterios', [])
        return WorkItemService.create_story(validated_data, criteria=criterios_data)

    def update(self, instance, validated_data):
        # La actualización de criterios se maneja mediante el servicio para asegurar consistencia
        criterios_data = validated_data.pop('criterios', None)
        instance = super().update(instance, validated_data)
        if criterios_data is not None:
            # Podríamos mover esto a WorkItemService.update_story
            instance.criterios.all().delete()
            for criterio in criterios_data:
                from ..models import CriterioAceptacion

                CriterioAceptacion.objects.create(historia=instance, **criterio)
        return instance
