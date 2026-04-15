import logging

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Controlador centralizado de excepciones para una API profesional y consistente.
    Transforma errores en un esquema JSON estandarizado.
    En modo DEBUG se expone el detalle del error; en producción se oculta.
    """
    response = exception_handler(exc, context)

    if response is None:
        logger.error('Unhandled Exception: %s', str(exc), exc_info=True)
        return Response(
            {
                'error': 'Error interno del servidor',
                'detail': str(exc) if settings.DEBUG else 'Consulte los logs para más detalles',
                'code': 'internal_server_error',
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Personalización del formato de error
    custom_data = {
        'error': 'Error de validación' if response.status_code == 400 else 'Error de API',
        'status_code': response.status_code,
        'details': response.data,
    }

    # Mapeo de códigos amigables
    if response.status_code == 401:
        custom_data['code'] = 'unauthorized'
    elif response.status_code == 403:
        custom_data['code'] = 'forbidden'
    elif response.status_code == 404:
        custom_data['code'] = 'not_found'
    else:
        custom_data['code'] = 'api_error'

    response.data = custom_data
    return response
