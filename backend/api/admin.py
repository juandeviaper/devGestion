from django.contrib import admin

from .models import (
    Adjunto,
    Bug,
    Comentario,
    CriterioAceptacion,
    Epica,
    HistoriaUsuario,
    InvitacionProyecto,
    Notification,
    Profile,
    Proyecto,
    ProyectoMiembro,
    Sprint,
    Tarea,
)


# Registro centralizado de modelos en el panel administrativo

admin.site.register(Proyecto)
admin.site.register(ProyectoMiembro)
admin.site.register(InvitacionProyecto)
admin.site.register(Sprint)
admin.site.register(Epica)
admin.site.register(HistoriaUsuario)
admin.site.register(CriterioAceptacion)
admin.site.register(Comentario)
admin.site.register(Adjunto)
admin.site.register(Tarea)
admin.site.register(Bug)
admin.site.register(Profile)
admin.site.register(Notification)
