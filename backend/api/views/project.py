from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from ..services.report_service import ReportService

from ..models import HistoriaUsuario, InvitacionProyecto, Notification, Proyecto, ProyectoMiembro
from ..permissions import IsInvitationParticipant, IsProjectMember, IsProjectOwner
from ..serializers import (
    InvitacionProyectoSerializer,
    ProyectoMiembroSerializer,
    ProyectoSerializer,
)
from ..permissions import IsInvitationParticipant, IsProjectMember, IsProjectOwner, IsOwnerOrPublicReadOnly
from ..services.project_service import ProjectService


class ProyectoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de Proyectos.
    Aplica optimizaciones de carga (N+1) y filtrado de visibilidad profesional.
    """

    serializer_class = ProyectoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def permission_denied(self, request, message=None, code=None):
        from rest_framework import exceptions
        raise exceptions.PermissionDenied(detail={"error": message or "No tienes permisos para acceder o gestionar este proyecto"})

    def get_permissions(self):
        """
        Diferencia permisos:
        - list, retrieve: Los proyectos públicos son accesibles como lectura.
        - stats, members, download_report: Requieren ser miembro o dueño.
        - destroy, update, create: Requieren ser dueño.
        """
        if self.action in ['list', 'stats', 'user_stats']:
            return [permissions.IsAuthenticated()]
        
        if self.action in ['retrieve', 'members']:
            return [permissions.IsAuthenticated(), IsOwnerOrPublicReadOnly()]
            
        if self.action in ['metrics', 'download_report']:
            return [permissions.IsAuthenticated(), IsProjectMember()]
            
        return [permissions.IsAuthenticated(), IsProjectOwner()]

    def get_queryset(self):
        user = self.request.user
        queryset = Proyecto.objects.select_related('creador').all()

        if not user.is_authenticated:
            return queryset.filter(visibilidad='publico')

        # Si es una acción de detalle (retrieve, members, etc), permitimos encontrar 
        # el proyecto si es público o si el usuario tiene relación.
        if self.action not in ['list', 'stats']:
            return queryset.filter(
                Q(creador=user) | Q(miembros__usuario=user) | Q(visibilidad='publico')
            ).distinct()

        is_discover = self.request.query_params.get('discover', 'false').lower() == 'true'

        if is_discover:
            return queryset.filter(
                Q(creador=user) | Q(miembros__usuario=user) | Q(visibilidad='publico')
            ).distinct()

        # Fuera de "descubrir", en la lista principal el usuario solo ve sus proyectos
        return queryset.filter(
            Q(creador=user) | Q(miembros__usuario=user)
        ).distinct()

    def perform_create(self, serializer):
        creador = self.request.user
        creator_id = self.request.data.get('creator_id')

        if self.request.user.is_staff and creator_id:
            try:
                creador = User.objects.get(id=creator_id)
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {'creator_id': 'El usuario especificado como creador no existe.'}
                ) from None

        proyecto = ProjectService.create_project(
            nombre=serializer.validated_data['nombre'],
            descripcion=serializer.validated_data.get('descripcion', ''),
            creador=creador,
            visibilidad=serializer.validated_data.get('visibilidad', 'privado'),
        )
        serializer.instance = proyecto

    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.get_queryset()
        total_proyectos = queryset.count()
        miembros_totales = (
            ProyectoMiembro.objects.filter(proyecto__in=queryset)
            .values('usuario')
            .distinct()
            .count()
        )
        historias_totales = HistoriaUsuario.objects.filter(proyecto__in=queryset).count()

        return Response(
            {
                'total_proyectos': total_proyectos,
                'miembros_totales': miembros_totales,
                'historias_totales': historias_totales,
            }
        )

    @action(detail=False, methods=['get'])
    def user_stats(self, request):
        """
        Retorna estadísticas del proyecto para un usuario específico (por username).
        GET /api/proyectos/user_stats/?username=<value>
        """
        username = request.query_params.get('username')
        if username:
            from django.contrib.auth.models import User as DjangoUser
            try:
                target_user = DjangoUser.objects.get(username=username)
            except DjangoUser.DoesNotExist:
                return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        else:
            target_user = request.user

        proyectos = Proyecto.objects.filter(
            Q(creador=target_user) | Q(miembros__usuario=target_user)
        ).distinct()

        historias = HistoriaUsuario.objects.filter(proyecto__in=proyectos)
        return Response({
            'total_proyectos': proyectos.count(),
            'historias_totales': historias.count(),
            'historias_completadas': historias.filter(estado='terminado').count(),
        })

    @action(detail=True, methods=['get'])
    def metrics(self, request, pk=None):
        """
        Retorna las métricas de SCRUM del proyecto (horas, progreso, costos).
        Se llama get_object() primero para verificar permisos del usuario sobre este proyecto.
        """
        proyecto = self.get_object()  # Verifica is_member
        stats = ReportService.get_project_stats(proyecto.pk)
        return Response(stats)

    @action(detail=True, methods=['get'])
    def download_report(self, request, pk=None):
        """
        Genera y descarga un reporte PDF profesional del proyecto.
        """
        project = self.get_object()
        pdf_buffer = ReportService.generate_project_pdf(pk)
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Reporte_{project.nombre}.pdf"'
        return response

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        proyecto = self.get_object()
        miembros = proyecto.miembros.all()
        serializer = ProyectoMiembroSerializer(miembros, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        proyecto = self.get_object()
        username = request.data.get('username')
        rol = request.data.get('rol', 'colaborador')

        try:
            user_to_add = User.objects.get(username=username)
            miembro, created = ProyectoMiembro.objects.get_or_create(
                proyecto=proyecto, usuario=user_to_add, defaults={'rol_proyecto': rol}
            )
            if not created:
                miembro.rol_proyecto = rol
                miembro.save()
            return Response({'status': 'miembro añadido/actualizado'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        proyecto = self.get_object()
        username = request.data.get('username')
        try:
            user_to_remove = User.objects.get(username=username)
            if user_to_remove == proyecto.creador:
                return Response(
                    {'error': 'No puedes eliminar al dueño del proyecto'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ProyectoMiembro.objects.filter(proyecto=proyecto, usuario=user_to_remove).delete()
            return Response({'status': 'miembro eliminado'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class InvitacionProyectoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar solicitudes de invitación a proyectos.
    """

    serializer_class = InvitacionProyectoSerializer
    permission_classes = [permissions.IsAuthenticated, IsInvitationParticipant]

    def get_queryset(self):
        user = self.request.user
        return InvitacionProyecto.objects.filter(
            Q(usuario_invitado=user) | Q(usuario_remitente=user)
        ).distinct()

    def perform_create(self, serializer):
        proyecto = serializer.validated_data['proyecto']
        user = self.request.user

        # Verificar si el usuario es dueño del proyecto (por creador O por rol en ProyectoMiembro)
        es_dueno = (
            proyecto.creador == user
            or ProyectoMiembro.objects.filter(
                proyecto=proyecto, usuario=user, rol_proyecto='dueño'
            ).exists()
        )
        if not es_dueno:
            raise serializers.ValidationError(
                'Solo el dueño del proyecto puede enviar invitaciones.'
            )

        usuario_invitado = serializer.validated_data['usuario_invitado']
        if ProyectoMiembro.objects.filter(proyecto=proyecto, usuario=usuario_invitado).exists():
            raise serializers.ValidationError('El usuario ya es miembro de este proyecto.')

        if InvitacionProyecto.objects.filter(
            proyecto=proyecto, usuario_invitado=usuario_invitado, estado='pendiente'
        ).exists():
            raise serializers.ValidationError(
                'Ya existe una invitación pendiente para este usuario.'
            )

        serializer.save(usuario_remitente=self.request.user)

    @action(detail=True, methods=['post'])
    def aceptar(self, request, pk=None):
        invitacion = self.get_object()
        if invitacion.usuario_invitado != request.user:
            return Response(
                {'error': 'No puedes aceptar una invitación que no es para ti.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if invitacion.estado != 'pendiente':
            return Response(
                {'error': 'Esta invitación ya ha sido procesada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitacion.estado = 'aceptada'
        invitacion.fecha_respuesta = timezone.now()
        invitacion.save()

        ProyectoMiembro.objects.get_or_create(
            proyecto=invitacion.proyecto,
            usuario=invitacion.usuario_invitado,
            defaults={'rol_proyecto': invitacion.rol_invitado},
        )

        Notification.objects.create(
            user=invitacion.usuario_remitente,
            title='Invitación Aceptada',
            message=f"{invitacion.usuario_invitado.username} ha aceptado tu invitación al proyecto '{invitacion.proyecto.nombre}'.",
            link=f'/project/{invitacion.proyecto.id}/members',
        )
        return Response({'status': 'invitación aceptada'})

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        invitacion = self.get_object()
        if invitacion.usuario_invitado != request.user:
            return Response(
                {'error': 'No puedes rechazar una invitación que no es para ti.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if invitacion.estado != 'pendiente':
            return Response(
                {'error': 'Esta invitación ya ha sido procesada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitacion.estado = 'rechazada'
        invitacion.fecha_respuesta = timezone.now()
        invitacion.save()

        Notification.objects.create(
            user=invitacion.usuario_remitente,
            title='Invitación Rechazada',
            message=f"{invitacion.usuario_invitado.username} ha rechazado tu invitación al proyecto '{invitacion.proyecto.nombre}'.",
            link='/dashboard',
        )
        return Response({'status': 'invitación rechazada'})
