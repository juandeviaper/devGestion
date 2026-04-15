from django.db import models

from .project import Proyecto


# Modelos del dominio de Sprints
# Responsabilidad: Definir la estructura de Sprints y su relación con Proyectos.


class Sprint(models.Model):
    """
    Modelo para gestionar Sprints (iteraciones) dentro de un proyecto.
    """

    ESTADO_CHOICES = [('planeado', 'Planeado'), ('activo', 'Activo'), ('terminado', 'Terminado')]

    nombre = models.CharField(max_length=100)
    objetivo = models.TextField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='planeado')
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='sprints')
    color = models.CharField(max_length=7, default='#10B981')

    class Meta:
        app_label = 'api'

    def __str__(self):
        return f'{self.nombre} ({self.proyecto.nombre})'
