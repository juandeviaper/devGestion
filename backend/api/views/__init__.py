from .bug import BugViewSet as BugViewSet
from .historia import (
    AdjuntoViewSet as AdjuntoViewSet,
    ComentarioViewSet as ComentarioViewSet,
    CriterioAceptacionViewSet as CriterioAceptacionViewSet,
    EpicaViewSet as EpicaViewSet,
    HistoriaUsuarioViewSet as HistoriaUsuarioViewSet,
)
from .notification import NotificationViewSet as NotificationViewSet
from .project import (
    InvitacionProyectoViewSet as InvitacionProyectoViewSet,
    ProyectoViewSet as ProyectoViewSet,
)
from .sprint import SprintViewSet as SprintViewSet
from .task import TareaViewSet as TareaViewSet
from .user import CheckEmailView as CheckEmailView, CheckUsernameView as CheckUsernameView, MeView as MeView, MyWorkItemsView as MyWorkItemsView, RegisterView as RegisterView, UserViewSet as UserViewSet

# Centralización de vistas
