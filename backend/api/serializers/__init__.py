from .bug import BugSerializer as BugSerializer
from .historia import (
    AdjuntoSerializer as AdjuntoSerializer,
    ComentarioSerializer as ComentarioSerializer,
    CriterioAceptacionSerializer as CriterioAceptacionSerializer,
    EpicaSerializer as EpicaSerializer,
    HistoriaUsuarioSerializer as HistoriaUsuarioSerializer,
)
from .notification import NotificationSerializer as NotificationSerializer
from .project import (
    InvitacionProyectoSerializer as InvitacionProyectoSerializer,
    ProyectoMiembroSerializer as ProyectoMiembroSerializer,
    ProyectoSerializer as ProyectoSerializer,
)
from .sprint import SprintSerializer as SprintSerializer
from .task import TareaSerializer as TareaSerializer
from .user import (
    ProfileSerializer as ProfileSerializer,
    UserSerializer as UserSerializer,
)

# Centralización de serializadores
