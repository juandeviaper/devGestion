from typing import Any

from django.contrib.auth.models import User

from ..models import Profile


class UserService:
    """
    Servicio de dominio para la gestión de Usuarios y Perfiles.
    Encapsula la lógica de negocio fuera de los Serializadores/Views.
    """

    @staticmethod
    def register_user(username, email, password, first_name='', last_name='') -> User:
        """
        Registra un nuevo usuario y crea su perfil asociado.
        """
        if User.objects.filter(email__iexact=email).exists():
            raise Exception('Ya existe una cuenta registrada con este correo electrónico.')

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        # El perfil se crea automáticamente mediante señales (se implementará después)
        # pero por ahora aseguramos su existencia
        Profile.objects.get_or_create(usuario=user)
        return user

    @staticmethod
    def update_profile(user: User, profile_data: dict[str, Any]) -> Profile:
        """
        Actualiza de forma segura la información del perfil del usuario.
        """
        profile, _ = Profile.objects.get_or_create(usuario=user)
        if 'bio' in profile_data:
            profile.bio = profile_data['bio']
        if 'especialidades' in profile_data:
            profile.especialidades = profile_data['especialidades']
        if 'foto_perfil' in profile_data and profile_data['foto_perfil']:
            profile.foto_perfil = profile_data['foto_perfil']
        profile.save()
        return profile
