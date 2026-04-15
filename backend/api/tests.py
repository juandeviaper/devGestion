from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Bug, Proyecto


class SmokeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123',
            'first_name': 'Test',
            'last_name': 'User',
        }

    def test_user_registration(self):
        """Verifica que el registro de usuario funcione a través de la API y el servicio."""
        response = self.client.post('/api/register/', self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_project_creation(self):
        """Verifica que la creación de proyectos funcione a través del ProjectService."""
        # Primero registrar y loguear
        self.client.post('/api/register/', self.user_data, format='json')
        # Obtener token
        token_res = self.client.post(
            '/api/token/', {'username': 'testuser', 'password': 'password123'}, format='json'
        )
        token = token_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Crear proyecto
        project_data = {
            'nombre': 'Proyecto de Prueba',
            'descripcion': 'Una descripción',
            'visibilidad': 'publico',
        }
        response = self.client.post('/api/proyectos/', project_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Proyecto.objects.filter(nombre='Proyecto de Prueba').exists())

    def test_bug_creation_with_valid_state(self):
        """Verifica que el reporte de bugs funcione con los estados sincronizados."""
        # Setup: Usuario y Proyecto
        user = User.objects.create_user(username='tester', password='password123')
        project = Proyecto.objects.create(nombre='Bug Project', creador=user)

        self.client.force_authenticate(user=user)

        # Intentar crear bug con estado 'nuevo' (sincronizado)
        bug_data = {
            'titulo': 'Critical Bug',
            'descripcion': 'Something broke',
            'prioridad': 'alta',
            'estado': 'nuevo',
            'proyecto': project.id,
        }
        response = self.client.post('/api/bugs/', bug_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Bug.objects.filter(titulo='Critical Bug').exists())
