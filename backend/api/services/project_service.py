from django.contrib.auth.models import User
from django.db import transaction

from ..models import Proyecto, ProyectoMiembro


class ProjectService:
    """
    Servicio de dominio para la gestión de Proyectos y Membresías.
    Garantiza atomicidad en operaciones complejas de proyectos.
    """

    @staticmethod
    @transaction.atomic
    def create_project(nombre, creador, descripcion='', visibilidad='privado') -> Proyecto:
        """
        Crea un proyecto y asigna al creador como DUEÑO automáticamente.
        """
        proyecto = Proyecto.objects.create(
            creador=creador, nombre=nombre, descripcion=descripcion, visibilidad=visibilidad
        )

        # Asignación automática de rol de dueño
        ProyectoMiembro.objects.get_or_create(
            proyecto=proyecto, usuario=creador, defaults={'rol_proyecto': 'dueño'}
        )

        return proyecto

    @staticmethod
    def add_member(proyecto: Proyecto, user: User, role: str = 'colaborador') -> ProyectoMiembro:
        """
        Añade un miembro al proyecto validando pre-condiciones.
        """
        miembro, created = ProyectoMiembro.objects.get_or_create(
            proyecto=proyecto, usuario=user, defaults={'rol_proyecto': role}
        )
        if not created:
            miembro.rol_proyecto = role
            miembro.save()
        return miembro
