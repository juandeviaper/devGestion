from django.contrib.auth.models import User
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Bug, HistoriaUsuario, Notification, Profile, Tarea


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Garantiza que cada usuario nuevo tenga un perfil.
    """
    if created:
        Profile.objects.get_or_create(usuario=instance)


def _get_previous_assignee(sender, instance):
    """
    Retorna el valor anterior de `asignado_a` para detectar cambios reales.
    Retorna None si es un objeto nuevo o si no existía asignación previa.
    """
    if not instance.pk:
        return None
    try:
        return sender.objects.values_list('asignado_a', flat=True).get(pk=instance.pk)
    except sender.DoesNotExist:
        return None


@receiver(pre_save, sender=HistoriaUsuario)
@receiver(pre_save, sender=Tarea)
@receiver(pre_save, sender=Bug)
def cache_previous_assignee(sender, instance, **kwargs):
    """
    Almacena en memoria el `asignado_a` anterior antes de guardar.
    Permite que `notify_assignment` detecte si el campo realmente cambió.
    """
    instance._previous_assignee_id = _get_previous_assignee(sender, instance)


@receiver(post_save, sender=HistoriaUsuario)
@receiver(post_save, sender=Tarea)
@receiver(post_save, sender=Bug)
def notify_assignment(sender, instance, created, **kwargs):
    """
    Genera una notificación ÚNICAMENTE cuando `asignado_a` cambia a un nuevo usuario.
    Evita spam de notificaciones en simples actualizaciones de estado u otros campos.
    """
    if not instance.asignado_a:
        return

    previous_id = getattr(instance, '_previous_assignee_id', None)
    current_id = instance.asignado_a_id

    # Solo notificar si la asignación es nueva o cambia a un usuario diferente
    if previous_id == current_id:
        return

    Notification.objects.create(
        user=instance.asignado_a,
        title=f'Nueva asignación: {instance.titulo}',
        message=(
            f'Se te ha asignado un nuevo {sender.__name__} '
            f"en el proyecto '{instance.proyecto.nombre}'."
        ),
        link=f'/proyectos/{instance.proyecto.id}/kanban',
    )
