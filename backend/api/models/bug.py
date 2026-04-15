from django.contrib.auth.models import User
from django.db import models

from .historia import HistoriaUsuario
from .project import Proyecto


# Modelos del dominio de Bugs
# Responsabilidad: Definir la estructura de Bugs y su relación con Historias y Proyectos.


class Bug(models.Model):
    """
    Reporte de un error o comportamiento inesperado en el sistema.
    """

    PRIORIDAD_CHOICES = [('baja', 'Baja'), ('media', 'Media'), ('alta', 'Alta')]
    ESTADO_CHOICES = [
        ('nuevo', 'Nuevo'),
        ('en progreso', 'En Progreso'),
        ('corregido', 'Corregido'),
        ('cerrado', 'Cerrado'),
    ]

    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='nuevo')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='bugs')
    historia = models.ForeignKey(
        HistoriaUsuario, on_delete=models.CASCADE, null=True, blank=True, related_name='bugs'
    )
    asignado_a = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='bugs_asignados'
    )
    horas_estimadas = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    horas_reales = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)

    class Meta:
        app_label = 'api'

    def __str__(self):
        return self.titulo
