from django.contrib.auth.models import User
from django.db import models


# Modelos del dominio de Usuarios (Extensión y Notificaciones)


class Profile(models.Model):
    """
    Extensión del modelo de usuario base de Django.
    Almacena información adicional del usuario.
    """

    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    especialidades = models.TextField(blank=True, help_text='Comprimidas por comas o JSON')
    bio = models.TextField(blank=True)
    foto_perfil = models.ImageField(upload_to='avatars/', null=True, blank=True)

    class Meta:
        app_label = 'api'

    def __str__(self):
        return f'Perfil de {self.usuario.username}'


class Notification(models.Model):
    """
    Modelo para notificaciones persistentes del sistema.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=500, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'api'
        ordering = ['-created_at']

    def __str__(self):
        return f'Notif for {self.user.username}: {self.title}'
