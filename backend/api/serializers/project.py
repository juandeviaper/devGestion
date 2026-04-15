from rest_framework import serializers

from ..models import InvitacionProyecto, Proyecto, ProyectoMiembro
from .user import UserSerializer


# Serializadores del dominio de Proyectos


class ProyectoMiembroSerializer(serializers.ModelSerializer):
    usuario_detalle = UserSerializer(source='usuario', read_only=True)

    class Meta:
        model = ProyectoMiembro
        fields = ['id', 'usuario', 'usuario_detalle', 'rol_proyecto', 'fecha_union']
        read_only_fields = ['fecha_union']


class ProyectoSerializer(serializers.ModelSerializer):
    creador = UserSerializer(read_only=True)
    miembros_count = serializers.SerializerMethodField()
    progreso = serializers.SerializerMethodField()

    class Meta:
        model = Proyecto
        fields = [
            'id',
            'nombre',
            'descripcion',
            'visibilidad',
            'estado',
            'repositorio_url',
            'fecha_creacion',
            'creador',
            'miembros_count',
            'progreso',
        ]
        read_only_fields = ['fecha_creacion', 'creador']

    def get_miembros_count(self, obj):
        return obj.miembros.count()

    def get_progreso(self, obj):
        from ..models import HistoriaUsuario

        total = HistoriaUsuario.objects.filter(proyecto=obj).count()
        if total == 0:
            return 0
        completadas = HistoriaUsuario.objects.filter(proyecto=obj, estado='terminado').count()
        return round((completadas / total) * 100)



class InvitacionProyectoSerializer(serializers.ModelSerializer):
    proyecto_detalle = ProyectoSerializer(source='proyecto', read_only=True)
    usuario_invitado_detalle = UserSerializer(source='usuario_invitado', read_only=True)
    usuario_remitente_detalle = UserSerializer(source='usuario_remitente', read_only=True)

    class Meta:
        model = InvitacionProyecto
        fields = [
            'id',
            'proyecto',
            'proyecto_detalle',
            'usuario_invitado',
            'usuario_invitado_detalle',
            'usuario_remitente',
            'usuario_remitente_detalle',
            'rol_invitado',
            'estado',
            'fecha_creacion',
            'fecha_respuesta',
        ]
        read_only_fields = ['usuario_remitente', 'estado', 'fecha_creacion', 'fecha_respuesta']
