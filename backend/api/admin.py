from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

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


# Personalización de la administración de Usuarios con Perfil Inline
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Perfil'
    fk_name = 'usuario'


class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
    list_select_related = ('perfil',)

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return list()
        return super(UserAdmin, self).get_inline_instances(request, obj)


# Re-registro del modelo User
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Registro centralizado del resto de modelos
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
admin.site.register(Notification)
# No registramos Profile solo, ya está como Inline en User
