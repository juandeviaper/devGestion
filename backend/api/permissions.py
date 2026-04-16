from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import permissions

from .models import Proyecto, ProyectoMiembro


# ==============================================================================
# PERMISOS GLOBALES Y DE ROL
# ==============================================================================


class IsAdminUser(permissions.BasePermission):
    """
    Permiso para el rol ADMIN (Líder de Proyectos).
    Valida si el usuario es staff en Django.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsSelfOrAdmin(permissions.BasePermission):
    """
    Permiso para que un usuario solo pueda gestionar su propia información,
    a menos que sea ADMIN.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff:
            return True

        if isinstance(obj, User):
            return obj == request.user

        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user

        return False


# ==============================================================================
# PERMISOS DE PROYECTO
# ==============================================================================


class IsProjectOwner(permissions.BasePermission):
    """
    Permiso para el DUEÑO DEL PROYECTO.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if request.user.is_staff:
            return True

        if request.method == 'POST':
            proyecto_id = request.data.get('proyecto')
            if proyecto_id:
                return Proyecto.objects.filter(
                    (Q(creador=request.user) | Q(miembros__usuario=request.user, miembros__rol_proyecto='dueño')),
                    id=proyecto_id
                ).exists()
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_staff:
            return True

        # Extraer el proyecto dependiendo de si el objeto es un Proyecto, tiene relación directa, o está a 1 nivel de profundidad (ej. CriterioAceptacion -> Historia)
        proyecto = None
        if isinstance(obj, Proyecto):
            proyecto = obj
        elif hasattr(obj, 'proyecto'):
            proyecto = obj.proyecto
        elif hasattr(obj, 'historia') and obj.historia:
            proyecto = getattr(obj.historia, 'proyecto', None)
        elif hasattr(obj, 'tarea') and obj.tarea:
            proyecto = getattr(obj.tarea, 'proyecto', None)
        elif hasattr(obj, 'bug') and obj.bug:
            proyecto = getattr(obj.bug, 'proyecto', None)

        if not proyecto:
            return False

        if proyecto.creador == user:
            return True

        return ProyectoMiembro.objects.filter(
            proyecto=proyecto, usuario=user, rol_proyecto='dueño'
        ).exists()


class IsProjectMember(permissions.BasePermission):
    """
    Permiso para CUALQUIER MIEMBRO del proyecto.
    has_permission: Siempre True para usuarios autenticados (el queryset ya filtra visibilidad).
    has_object_permission: Solo miembros o creadores del proyecto.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.is_staff:
            return True

        if request.method == 'POST':
            proyecto_id = request.data.get('proyecto')
            if proyecto_id:
                return Proyecto.objects.filter(
                    (Q(creador=request.user) | Q(miembros__usuario=request.user)),
                    id=proyecto_id
                ).exists()
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_staff:
            return True

        proyecto = None
        if isinstance(obj, Proyecto):
            proyecto = obj
        elif hasattr(obj, 'proyecto'):
            proyecto = obj.proyecto
        elif hasattr(obj, 'historia') and obj.historia:
            proyecto = getattr(obj.historia, 'proyecto', None)
        elif hasattr(obj, 'tarea') and obj.tarea:
            proyecto = getattr(obj.tarea, 'proyecto', None)
        elif hasattr(obj, 'bug') and obj.bug:
            proyecto = getattr(obj.bug, 'proyecto', None)
            
        if not proyecto:
            return False

        if proyecto.creador == user:
            return True

        return ProyectoMiembro.objects.filter(proyecto=proyecto, usuario=user).exists()


class IsOwnerOrPublicReadOnly(permissions.BasePermission):
    """
    Permite acceso total a dueños y miembros (para sus respectivos niveles).
    Permite lectura (GET, HEAD, OPTIONS) a cualquier usuario autenticado si el proyecto es público.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        proyecto = None
        if isinstance(obj, Proyecto):
            proyecto = obj
        elif hasattr(obj, 'proyecto'):
            proyecto = obj.proyecto
        elif hasattr(obj, 'historia') and obj.historia:
            proyecto = getattr(obj.historia, 'proyecto', None)
        elif hasattr(obj, 'tarea') and obj.tarea:
            proyecto = getattr(obj.tarea, 'proyecto', None)
        elif hasattr(obj, 'bug') and obj.bug:
            proyecto = getattr(obj.bug, 'proyecto', None)
            
        if not proyecto:
            return False

        # Si el proyecto es público, permitimos lectura a cualquiera
        if proyecto.visibilidad == 'publico' and request.method in permissions.SAFE_METHODS:
            return True

        # Si no es público o es una acción de escritura, delegamos a IsProjectMember
        # (o IsProjectOwner según la vista, pero aquí validamos acceso base)
        return IsProjectMember().has_object_permission(request, view, obj)


class IsInvitationParticipant(permissions.BasePermission):
    """
    Permiso para los participantes de una INVITACIÓN.
    has_permission: Cualquier usuario autenticado puede listar (el queryset filtra los propios).
    has_object_permission: Solo el remitente o destinatario de la invitación.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_staff:
            return True

        return obj.usuario_invitado == user or obj.usuario_remitente == user


# ==============================================================================
# PERMISOS DE WORK ITEMS (Historias, Tareas, Bugs)
# ==============================================================================


class IsOwnerOrAdminToCreateUpdate(permissions.BasePermission):
    """
    Controla la creación y edición completa de work items.
    Cualquier miembro del proyecto puede crear. Solo dueños pueden editar/eliminar.
    """

    def has_permission(self, request, view):
        if request.user.is_staff:
            return True

        if request.method == 'POST':
            proyecto_id = request.data.get('proyecto')
            if not proyecto_id:
                return True

            try:
                proyecto = Proyecto.objects.get(id=proyecto_id)
                # Cualquier miembro del proyecto puede crear work items
                return (
                    proyecto.creador == request.user
                    or ProyectoMiembro.objects.filter(
                        proyecto=proyecto, usuario=request.user
                    ).exists()
                )
            except Proyecto.DoesNotExist:
                return False
        return True

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True

        if request.method in permissions.SAFE_METHODS:
            return True

        # Si es un método de edición, permitimos a cualquier miembro del proyecto.
        if request.method in ['PUT', 'PATCH']:
            return IsProjectMember().has_object_permission(request, view, obj)
            
        # Si es borrado, solo el dueño puede proceder.
        if request.method == 'DELETE':
            return IsProjectOwner().has_object_permission(request, view, obj)

        # Para otros métodos, permitimos si es miembro o dueño.
        return IsProjectMember().has_object_permission(request, view, obj)


class CanUpdateStatusIfAssigned(permissions.BasePermission):
    """
    Permite a los colaboradores actualizar ÚNICAMENTE el estado de sus items asignados.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True

        is_owner = (
            ProyectoMiembro.objects.filter(
                proyecto=obj.proyecto, usuario=request.user, rol_proyecto='dueño'
            ).exists()
            or obj.proyecto.creador == request.user
        )

        if is_owner:
            return True

        return bool(request.method == 'PATCH' and obj.asignado_a == request.user)


class CanViewOnlyAssignedIfCollaborator(permissions.BasePermission):
    """
    Los colaboradores solo pueden ver items asignados a ellos.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_staff:
            return True

        if IsProjectOwner().has_object_permission(request, view, obj):
            return True

        if hasattr(obj, 'asignado_a'):
            return obj.asignado_a == user

        return False
