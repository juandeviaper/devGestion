from django.contrib.auth.models import User
from django.db import models

from .project import Proyecto
from .sprint import Sprint


# Modelos del dominio de Historias de Usuario
# Responsabilidad: Definir Epicas, Historias, Criterios, Comentarios y Adjuntos.


class Epica(models.Model):
    """
    Agrupador de alto nivel para Historias de Usuario.
    """

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en progreso', 'En Progreso'),
        ('terminado', 'Terminado'),
    ]

    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='epicas')

    class Meta:
        app_label = 'api'

    def __str__(self):
        return self.titulo


class HistoriaUsuario(models.Model):
    """
    Unidad de trabajo principal que describe una funcionalidad desde la perspectiva del usuario.
    """

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en progreso', 'En Progreso'),
        ('en pruebas', 'En Pruebas'),
        ('terminado', 'Terminado'),
    ]
    PRIORIDAD_CHOICES = [('baja', 'Baja'), ('media', 'Media'), ('alta', 'Alta')]

    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='historias')
    epica = models.ForeignKey(
        Epica, on_delete=models.SET_NULL, null=True, blank=True, related_name='historias'
    )
    sprint = models.ForeignKey(
        Sprint, on_delete=models.SET_NULL, null=True, blank=True, related_name='historias'
    )
    asignado_a = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='historias_asignadas'
    )
    horas_estimadas = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    horas_reales = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'api'

    def __str__(self):
        return self.titulo


class CriterioAceptacion(models.Model):
    """
    Condiciones que debe cumplir una Historia de Usuario para considerarse terminada.
    """

    descripcion = models.CharField(max_length=500)
    completado = models.BooleanField(default=False)
    historia = models.ForeignKey(
        HistoriaUsuario, on_delete=models.CASCADE, related_name='criterios'
    )

    class Meta:
        app_label = 'api'


class Comentario(models.Model):
    """
    Retroalimentación o notas en Historias o Proyectos.
    """

    contenido = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    historia = models.ForeignKey(
        HistoriaUsuario, on_delete=models.CASCADE, null=True, blank=True, related_name='comentarios'
    )
    proyecto = models.ForeignKey(
        Proyecto, on_delete=models.CASCADE, null=True, blank=True, related_name='comentarios'
    )

    class Meta:
        app_label = 'api'


class Adjunto(models.Model):
    """
    Archivos vinculados a una Historia de Usuario.
    """

    nombre_archivo = models.CharField(max_length=255)
    url_archivo = models.URLField(max_length=1000)
    tipo_archivo = models.CharField(max_length=50)  # image, pdf, code, etc.
    fecha_subida = models.DateTimeField(auto_now_add=True)
    historia = models.ForeignKey(HistoriaUsuario, on_delete=models.CASCADE, related_name='adjuntos')
    subido_por = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        app_label = 'api'
