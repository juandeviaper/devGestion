from django.contrib.auth.models import User
from django.db import models


# Modelos del dominio de Proyectos
# Responsabilidad: Definir la estructura de Proyectos, Miembros e Invitaciones.


class Proyecto(models.Model):
    """
    Modelo principal para un Proyecto.
    Un proyecto es el contenedor de todo el trabajo (Sprints, Historias, etc.).
    """

    VISIBILIDAD_CHOICES = [('publico', 'Público'), ('privado', 'Privado')]
    ESTADO_CHOICES = [('activo', 'Activo'), ('finalizado', 'Finalizado')]

    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    repositorio_url = models.URLField(max_length=500, null=True, blank=True)
    visibilidad = models.CharField(max_length=10, choices=VISIBILIDAD_CHOICES, default='privado')
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creador = models.ForeignKey(User, on_delete=models.CASCADE, related_name='proyectos_creados')

    class Meta:
        app_label = 'api'

    def __str__(self):
        return self.nombre


class ProyectoMiembro(models.Model):
    """
    Relación muchos a muchos entre Usuarios y Proyectos con roles específicos.
    """

    ROL_CHOICES = [
        ('dueño', 'Dueño'),
        ('colaborador', 'Colaborador'),
    ]

    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='miembros')
    usuario = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='proyectos_pertenecientes'
    )
    rol_proyecto = models.CharField(max_length=20, choices=ROL_CHOICES, default='colaborador')
    fecha_union = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'api'
        unique_together = ('proyecto', 'usuario')


class InvitacionProyecto(models.Model):
    """
    Modelo para gestionar invitaciones a proyectos.
    Permite a los dueños invitar a otros usuarios.
    """

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aceptada', 'Aceptada'),
        ('rechazada', 'Rechazada'),
    ]
    ROL_CHOICES = [
        ('colaborador', 'Colaborador'),
    ]

    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='invitaciones')
    usuario_invitado = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='invitaciones_recibidas'
    )
    usuario_remitente = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='invitaciones_enviadas'
    )
    rol_invitado = models.CharField(max_length=20, choices=ROL_CHOICES, default='colaborador')
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_respuesta = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = 'api'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f'Invitación a {self.usuario_invitado.username} para {self.proyecto.nombre}'
