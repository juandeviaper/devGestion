from django.contrib.auth.models import User
from rest_framework import serializers

from ..models import Profile


# Serializadores del dominio de Usuarios
# Responsabilidad: Gestionar la transformación de User y Profile a JSON.


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Profile.
    """

    class Meta:
        model = Profile
        fields = ['especialidades', 'bio', 'foto_perfil']


class UserSerializer(serializers.ModelSerializer):
    """
    Serializador principal para el modelo User de Django.
    Maneja la lógica de actualización compleja de FormData.
    """

    perfil = ProfileSerializer(required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'perfil',
            'password',
            'is_staff',
            'is_active',
        ]
        read_only_fields = ['is_active']

    def to_internal_value(self, data):
        # Manejar FormData plano proveniente del frontend (ej. 'perfil.bio')
        if any(f'perfil.{field}' in data for field in ['bio', 'especialidades', 'foto_perfil']):
            new_data = data.copy()
            perfil = {}
            if 'perfil.bio' in data:
                perfil['bio'] = data.get('perfil.bio')
            if 'perfil.especialidades' in data:
                perfil['especialidades'] = data.get('perfil.especialidades')
            if 'perfil.foto_perfil' in data:
                foto = data.get('perfil.foto_perfil')
                if foto:
                    perfil['foto_perfil'] = foto

            new_data['perfil'] = perfil
            return super().to_internal_value(new_data)
        return super().to_internal_value(data)

    def create(self, validated_data):
        # La lógica de creación se delega al servicio o al modelo base create_user
        # Las señales se encargan del perfil automáticamente.
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        # Solo manejamos la actualización de campos básicos aquí.
        # El perfil se maneja por separado si es necesario, o mediante una vista dedicada.
        perfil_data = validated_data.pop('perfil', None)
        instance = super().update(instance, validated_data)
        if perfil_data:
            from ..services.user_service import UserService

            UserService.update_profile(instance, perfil_data)
        return instance


