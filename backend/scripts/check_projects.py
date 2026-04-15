import os

import django


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

from api.models import Proyecto


print('--- Usuarios ---')
for u in User.objects.all():
    print(f'ID: {u.id}, Username: {u.username}')

print('\n--- Proyectos ---')
for p in Proyecto.objects.all():
    print(
        f'ID: {p.id}, Nombre: {p.nombre}, Visibilidad: {p.visibilidad}, Creador: {p.creador.username}'
    )
