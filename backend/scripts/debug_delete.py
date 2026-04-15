import os
import sys

import django


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import transaction

from api.models import Proyecto


project_id = sys.argv[1] if len(sys.argv) > 1 else None

if not project_id:
    print('Por favor, proporciona un ID de proyecto.')
    sys.exit(1)

try:
    project = Proyecto.objects.get(id=project_id)
    print(f'Intentando eliminar proyecto: {project.nombre} (ID: {project.id})')

    with transaction.atomic():
        project.delete()

    print('Proyecto eliminado exitosamente.')
except Proyecto.DoesNotExist:
    print(f'Proyecto con ID {project_id} no encontrado.')
except Exception:
    import traceback

    print('--- ERROR AL ELIMINAR ---')
    traceback.print_exc()
