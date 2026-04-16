import json
import os

from django.apps import apps
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction


# Obtenemos el modelo de usuario dinámicamente
User = get_user_model()


class Command(BaseCommand):
    """
    Comando robusto para poblar la base de datos sin dependencias de importación estática.
    Utiliza apps.get_model para evitar errores de resolución en el IDE.
    """

    help = 'Puebla la base de datos con datos realistas utilizando carga dinámica de modelos'

    def handle(self, *args, **options):
        # 1. Cargar Modelos dinámicamente
        try:
            Profile = apps.get_model('api', 'Profile')
            Proyecto = apps.get_model('api', 'Proyecto')
            ProyectoMiembro = apps.get_model('api', 'ProyectoMiembro')
            Sprint = apps.get_model('api', 'Sprint')
            HistoriaUsuario = apps.get_model('api', 'HistoriaUsuario')
            CriterioAceptacion = apps.get_model('api', 'CriterioAceptacion')
            Tarea = apps.get_model('api', 'Tarea')
            Bug = apps.get_model('api', 'Bug')
        except LookupError as e:
            self.stdout.write(self.style.ERROR(f'Error al cargar modelos: {e}'))
            return

        # 2. Configurar ruta del JSON
        json_path = os.path.join(settings.BASE_DIR, 'realistic_data.json')

        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f'Archivo JSON no encontrado: {json_path}'))
            return

        with open(json_path, encoding='utf-8') as f:
            data = json.load(f)

        self.stdout.write(self.style.SUCCESS('Sincronizando datos con carga dinámica...'))

        # Mapeos de estado
        status_map = {
            'Historia': {k: k for k in ['pendiente', 'en progreso', 'en pruebas', 'terminado']},
            'Bug': {
                'pendiente': 'nuevo',
                'activo': 'en progreso',
                'en progreso': 'en progreso',
                'corregido': 'corregido',
                'cerrado': 'cerrado',
                'nuevo': 'nuevo',
            },
            'Sprint': {'planificado': 'planeado', 'activo': 'activo', 'cerrado': 'terminado'},
        }

        with transaction.atomic():
            # 3. Usuarios
            u_map = {}
            for u_data in data['users']:
                user, _ = User.objects.get_or_create(
                    username=u_data['username'],
                    defaults={
                        'email': u_data['email'],
                        'first_name': u_data['full_name'].split(' ')[0],
                        'last_name': ' '.join(u_data['full_name'].split(' ')[1:]),
                        'is_staff': u_data['is_staff'],
                    },
                )
                user.set_password(u_data['password'])
                user.is_staff = u_data['is_staff']
                user.save()

                profile, _ = Profile.objects.get_or_create(usuario=user)
                profile.especialidades = u_data.get('specialty', '')
                profile.save()
                u_map[u_data['id']] = user

            # 4. Proyectos y cascada
            for p_data in data['projects']:
                owner_id = next(
                    (r['user_id'] for r in p_data['roles'] if r['role'] == 'Owner'), None
                )
                creador = u_map.get(owner_id) if owner_id else list(u_map.values())[0]

                proyecto, _ = Proyecto.objects.get_or_create(
                    nombre=p_data['name'],
                    defaults={
                        'descripcion': p_data['description'],
                        'creador': creador,
                        'visibilidad': 'publico' if p_data['id'] % 2 == 0 else 'privado',
                    },
                )

                for r_data in p_data['roles']:
                    m_user = u_map.get(r_data['user_id'])
                    if m_user:
                        ProyectoMiembro.objects.get_or_create(
                            proyecto=proyecto,
                            usuario=m_user,
                            defaults={
                                'rol_proyecto': 'dueño'
                                if r_data['role'] == 'Owner'
                                else 'colaborador'
                            },
                        )

                for s_data in p_data['sprints']:
                    sprint, _ = Sprint.objects.get_or_create(
                        nombre=s_data['name'],
                        proyecto=proyecto,
                        defaults={
                            'objetivo': s_data['goal'],
                            'fecha_inicio': s_data['start_date'],
                            'fecha_fin': s_data['end_date'],
                            'estado': status_map['Sprint'].get(s_data['status'], 'planeado'),
                        },
                    )

                    for item in s_data['work_items']:
                        self._handle_item(
                            proyecto,
                            sprint,
                            item,
                            u_map,
                            status_map,
                            HistoriaUsuario,
                            CriterioAceptacion,
                            Tarea,
                            Bug,
                        )

        self.stdout.write(
            self.style.SUCCESS(f'¡Éxito! Procesados {len(data["projects"])} proyectos.')
        )

    def _handle_item(
        self,
        proyecto,
        sprint,
        item,
        u_map,
        status_map,
        historia_model,
        criterio_model,
        tarea_model,
        bug_model,
    ):
        asignado = u_map.get(item['asignado_a'])
        tipo = item['type']

        if tipo == 'Historia':
            story, created = historia_model.objects.get_or_create(
                titulo=item['titulo'],
                proyecto=proyecto,
                defaults={
                    'descripcion': item.get('descripcion', item.get('description', '')),
                    'prioridad': item['prioridad'],
                    'estado': status_map['Historia'].get(item['estado'], 'pendiente'),
                    'sprint': sprint,
                    'asignado_a': asignado,
                },
            )
            if created and 'criterios_aceptacion' in item:
                criterio_model.objects.create(
                    historia=story, descripcion=item['criterios_aceptacion']
                )

        elif tipo == 'Tarea':
            tarea_model.objects.get_or_create(
                titulo=item['titulo'],
                proyecto=proyecto,
                defaults={
                    'descripcion': item['descripcion'],
                    'prioridad': item['prioridad'],
                    'estado': 'terminado' if item['estado'] == 'terminado' else 'pendiente',
                    'asignado_a': asignado,
                },
            )
        elif tipo == 'Bug':
            bug_model.objects.get_or_create(
                titulo=item['titulo'],
                proyecto=proyecto,
                defaults={
                    'descripcion': item['descripcion'],
                    'prioridad': item['prioridad'],
                    'estado': status_map['Bug'].get(item['estado'], 'nuevo'),
                    'asignado_a': asignado,
                },
            )
