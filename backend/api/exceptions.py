import logging

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Controlador centralizado de excepciones para una API profesional y consistente.
    Asegura que todos los errores sigan el formato {"error": "mensaje"}.
    """
    response = exception_handler(exc, context)

    if response is None:
        logger.error('Unhandled Exception: %s', str(exc), exc_info=True)
        return Response(
            {
                'error': 'Error interno del servidor. Por favor, contacte al soporte técnico.' if not settings.DEBUG else str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Si la respuesta ya es un diccionario, tratamos de estraer el mensaje más relevante.
    if isinstance(response.data, dict):
        if 'error' in response.data:
            # Ya viene con el formato correcto, lo dejamos
            pass
        elif 'detail' in response.data:
            # Formato estándar de DRF, lo renombramos a 'error'
            response.data = {'error': response.data['detail']}
        else:
            # Probablemente errores de validación (Serializer) - extraemos el primer error encontrado
            first_key = next(iter(response.data))
            first_error = response.data[first_key]
            if isinstance(first_error, list):
                first_error = first_error[0]
            
            message = f"Error en {first_key}: {first_error}"
            response.data = {'error': message}
    elif isinstance(response.data, list):
        # Si es una lista literal de errores
        response.data = {'error': response.data[0]}

    return response
