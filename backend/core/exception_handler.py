import traceback
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first to get the standard error response.
    response = exception_handler(exc, context)

    # If response is None, it means an unhandled exception occurred (results in 500 Internal Server Error)
    if response is None:
        tb = traceback.format_exc()
        logger.error(f"Unhandled exception: {exc}\nTraceback:\n{tb}")
        
        return Response({
            "detail": "Internal Server Error",
            "error_type": exc.__class__.__name__,
            "error_message": str(exc),
            "traceback": tb.split('\n')
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
