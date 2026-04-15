from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    AdjuntoViewSet,
    BugViewSet,
    CheckEmailView,
    CheckUsernameView,
    ComentarioViewSet,
    CriterioAceptacionViewSet,
    EpicaViewSet,
    HistoriaUsuarioViewSet,
    InvitacionProyectoViewSet,
    MeView,
    MyWorkItemsView,
    NotificationViewSet,
    ProyectoViewSet,
    RegisterView,
    SprintViewSet,
    TareaViewSet,
    UserViewSet,
)


# Centralización de URLs de la API
# Se usan los nombres de rutas esperados por el frontend (español para la mayoría)

router = DefaultRouter()

# Usuarios y Notificaciones
router.register(r'users', UserViewSet, basename='user')
router.register(r'notifications', NotificationViewSet, basename='notification')

# Proyectos e Invitaciones
router.register(
    r'proyectos', ProyectoViewSet, basename='proyecto'
)  # Cambiado de projects a proyectos
router.register(
    r'invitaciones', InvitacionProyectoViewSet, basename='invitacion'
)  # Cambiado de invitations a invitaciones

# Sprints
router.register(r'sprints', SprintViewSet, basename='sprint')

# Historias de Usuario, Epicas y Satélites
router.register(r'epicas', EpicaViewSet, basename='epica')  # Cambiado de epics a epicas
router.register(
    r'historias', HistoriaUsuarioViewSet, basename='historia-usuario'
)  # Cambiado de user-stories a historias
router.register(
    r'criterios', CriterioAceptacionViewSet, basename='criterio-aceptacion'
)  # Cambiado de acceptance-criteria a criterios
router.register(
    r'comentarios', ComentarioViewSet, basename='comentario'
)  # Cambiado de comments a comentarios
router.register(
    r'adjuntos', AdjuntoViewSet, basename='adjunto'
)  # Cambiado de attachments a adjuntos

# Tareas y Bugs
router.register(r'tareas', TareaViewSet, basename='tarea')  # Cambiado de tasks a tareas
router.register(r'bugs', BugViewSet, basename='bug')

urlpatterns = [
    # Endpoints de ViewSets
    path('', include(router.urls)),
    # Endpoints de Autenticación Manual
    path('register/', RegisterView.as_view(), name='register'),
    path('check-username/', CheckUsernameView.as_view(), name='check-username'),
    path('check-email/', CheckEmailView.as_view(), name='check-email'),
    path('me/', MeView.as_view(), name='me'),
    path('me/work-items/', MyWorkItemsView.as_view(), name='my-work-items'),
    # Endpoints de JWT (Tokens)
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
