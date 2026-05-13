from django.contrib.auth.models import User
from django.db import models

from .project import Proyecto
from .sprint import Sprint


class CeremoniaScrum(models.Model):
    """
    Modelo para registrar ceremonias de Scrum (Daily, Review, etc.).
    """

    TIPO_CHOICES = [
        ('daily', 'Daily Scrum'),
        ('review', 'Sprint Review'),
        ('planning', 'Sprint Planning'),
        ('retro', 'Sprint Retrospective'),
    ]

    ESTADO_CHOICES = [
        ('programada', 'Programada'),
        ('en_curso', 'En Curso'),
        ('finalizada', 'Finalizada'),
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha = models.DateTimeField()
    notas = models.TextField(blank=True)
    reunion_url = models.URLField(max_length=500, blank=True, null=True)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='programada')
    
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='ceremonias')
    sprint = models.ForeignKey(Sprint, on_delete=models.CASCADE, related_name='ceremonias', null=True, blank=True)
    
    participantes = models.ManyToManyField(User, related_name='ceremonias_asistidas', blank=True)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'api'
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.fecha.strftime('%d/%m/%Y')}"
