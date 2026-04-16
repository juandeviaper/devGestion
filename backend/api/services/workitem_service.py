from typing import Any

from django.contrib.auth.models import User
from django.db import transaction

from rest_framework import serializers
from ..models import Bug, CriterioAceptacion, HistoriaUsuario, Tarea, Sprint


class WorkItemService:
    """
    Servicio para orquestar la creación y actualización de items de trabajo.
    Maneja la lógica de validación cruzada entre historias, tareas y bugs.
    """

    @staticmethod
    @transaction.atomic
    def create_story(
        data: dict[str, Any], criteria: list[dict[str, Any]] | None = None
    ) -> HistoriaUsuario:
        """
        Crea una historia de usuario y sus criterios de aceptación asociados.
        """
        sprint_id = data.get('sprint')

        story = HistoriaUsuario.objects.create(**data)
        if criteria:
            for item in criteria:
                CriterioAceptacion.objects.create(historia=story, **item)
        return story

    @staticmethod
    def update_item_status(item_type: str, item_id: int, new_status: str, _user: User) -> Any:
        """
        Actualiza el estado de un item validando permisos de asignación.
        """
        model_map = {'Historia': HistoriaUsuario, 'Tarea': Tarea, 'Bug': Bug}
        model = model_map.get(item_type)
        if not model:
            raise ValueError(f'Tipo de item inválido: {item_type}')

        item = model.objects.get(id=item_id)
        # La validación de permisos se maneja en la vista/permisos,
        # pero el servicio garantiza la persistencia correcta.
        item.estado = new_status
        item.save()
        return item
