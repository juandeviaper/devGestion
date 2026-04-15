from django.contrib.auth.models import User
from django.db import models

from .historia import HistoriaUsuario
from .project import Proyecto


# Modelos del dominio de Tareas
# Responsabilidad: Definir la estructura de Tareas y su relación con Historias y Proyectos.


class Tarea(models.Model):
    """
    Unidad de acción técnica dentro de una Historia de Usuario o Proyecto.
    """

    PRIORIDAD_CHOICES = [('baja', 'Baja'), ('media', 'Media'), ('alta', 'Alta')]
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en progreso', 'En Progreso'),
        ('terminado', 'Terminado'),
    ]

    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    historia = models.ForeignKey(
        HistoriaUsuario, on_delete=models.CASCADE, related_name='tareas', null=True, blank=True
    )
    proyecto = models.ForeignKey(
        Proyecto, on_delete=models.CASCADE, related_name='tareas_directas', null=True, blank=True
    )
    asignado_a = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tareas_asignadas'
    )
    horas_estimadas = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    horas_reales = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)

    class Meta:
        app_label = 'api'

    def __str__(self):
        return self.titulo
