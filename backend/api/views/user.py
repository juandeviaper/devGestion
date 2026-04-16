from django.contrib.auth.models import User
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Proyecto, HistoriaUsuario, Tarea, Bug
from ..permissions import IsAdminUser, IsSelfOrAdmin
from ..serializers import ProyectoSerializer, UserSerializer, HistoriaUsuarioSerializer, TareaSerializer, BugSerializer


# ==============================================================================
# VISTAS DE USUARIO (GESTIÓN)
# ==============================================================================


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para listar y gestionar usuarios.
    """

    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'username'

    def permission_denied(self, request, message=None, code=None):
        from rest_framework import exceptions
        raise exceptions.PermissionDenied(detail={"error": message or "No tienes permisos para acceder o modificar este perfil de usuario"})

    def get_permissions(self):
        # Solo admins pueden crear usuarios directamente
        if self.action == 'create':
            return [IsAdminUser()]
        # Propias operaciones o admin para editar/eliminar
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsSelfOrAdmin()]
        # list (con ?search= para invitaciones), retrieve, check_username, public_profile
        # -> cualquier usuario autenticado. El queryset ya limita la visibilidad.
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = User.objects.select_related('perfil').filter(is_active=True)
        search = self.request.query_params.get('search', '')
        # Cualquier usuario autenticado puede buscar usuarios (para invitaciones)
        # Pero solo staff ve todos; los demás se ven a sí mismos en update/delete
        if search:
            from django.db.models import Q as DjangoQ
            queryset = queryset.filter(
                DjangoQ(username__icontains=search) | DjangoQ(first_name__icontains=search) | DjangoQ(last_name__icontains=search)
            )
        elif not self.request.user.is_staff and self.action in ['list']:
            # Sin búsqueda en 'list', solo staff ve todos
            queryset = queryset.filter(id=self.request.user.id)
        return queryset

    def get_object(self):
        """
        Soporte dual: acepta tanto ID numérico como username en la URL.
        Permite que adminUpdate('/users/5/') y public_profile('/users/admin/') funcionen.
        """
        from django.shortcuts import get_object_or_404
        queryset = self.get_queryset()
        lookup = self.kwargs.get(self.lookup_field, '')
        try:
            # Intentar como ID numérico primero
            pk = int(lookup)
            obj = get_object_or_404(
                User.objects.select_related('perfil').filter(is_active=True),
                pk=pk
            )
        except (ValueError, TypeError):
            # Fallback: buscar por username
            obj = get_object_or_404(queryset, username=lookup)
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def check_username(self, request):
        """
        Verifica si un nombre de usuario está disponible.
        GET /api/users/check_username/?username=<value>
        """
        username = request.query_params.get('username', '').strip()
        if not username:
            return Response(
                {'error': 'El parámetro "username" es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        exists = User.objects.filter(username__iexact=username).exists()
        return Response({'available': not exists})

    @action(detail=True, methods=['get'])
    def public_profile(self, request, username=None):
        """
        Retorna el perfil público del usuario incluyendo sus proyectos públicos.
        """
        user = self.get_object()
        user_serializer = self.get_serializer(user)

        projects = Proyecto.objects.filter(creador=user, visibilidad='publico')
        project_serializer = ProyectoSerializer(projects, many=True)

        return Response({'user': user_serializer.data, 'projects': project_serializer.data})


# ==============================================================================
# VISTAS DE AUTENTICACIÓN
# ==============================================================================


class RegisterView(APIView):
    """
    Vista para el registro de nuevos usuarios.
    Delega la lógica al servicio para asegurar atomicidad y consistencia.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        from ..services.user_service import UserService

        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not all([username, email, password]):
            return Response(
                {'error': 'Nombre de usuario, email y contraseña son obligatorios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = UserService.register_user(
                username=username,
                email=email,
                password=password,
                first_name=request.data.get('first_name', ''),
                last_name=request.data.get('last_name', ''),
            )
            return Response(
                {
                    'message': 'Usuario registrado exitosamente',
                    'user': {'id': user.id, 'username': user.username, 'email': user.email},
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CheckUsernameView(APIView):
    """
    Vista pública para verificar si un nombre de usuario ya está en uso.
    GET /api/check-username/?username=<value>
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        username = request.query_params.get('username', '').strip()
        if not username:
            return Response(
                {'error': 'El parámetro "username" es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        exists = User.objects.filter(username__iexact=username).exists()
        return Response({'available': not exists})


class CheckEmailView(APIView):
    """
    Vista pública para verificar si un email ya está en uso.
    GET /api/check-email/?email=<value>
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        email = request.query_params.get('email', '').strip()
        if not email:
            return Response(
                {'error': 'El parámetro "email" es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        exists = User.objects.filter(email__iexact=email).exists()
        return Response({'available': not exists})


class MeView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar o eliminar el perfil del usuario autenticado.
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def perform_destroy(self, instance):
        instance.delete()


class MyWorkItemsView(APIView):
    """
    Vista para obtener todos los ítems de trabajo (Historias, Tareas, Bugs)
    asignados al usuario autenticado en todos los proyectos.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        historias = HistoriaUsuario.objects.filter(asignado_a=user)
        tareas = Tarea.objects.filter(asignado_a=user)
        bugs = Bug.objects.filter(asignado_a=user)

        res = {
            'historias': HistoriaUsuarioSerializer(historias, many=True).data,
            'tareas': TareaSerializer(tareas, many=True).data,
            'bugs': BugSerializer(bugs, many=True).data,
        }
        return Response(res)
