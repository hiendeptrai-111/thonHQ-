from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView, UserViewSet, 
    SendRegisterCodeView, SendResetPasswordCodeView, VerifyResetPasswordView,
    UserChatHistoryView, AdminChatThreadsView, AdminChatHistoryView
)

router = DefaultRouter()
router.register(r'admin/users', UserViewSet, basename='admin-user')

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('register/send-code/', SendRegisterCodeView.as_view(), name='register_send_code'),
    path('password-reset/send-code/', SendResetPasswordCodeView.as_view(), name='reset_send_code'),
    path('password-reset/verify/', VerifyResetPasswordView.as_view(), name='reset_verify'),
    
    # Chat / Support routes
    path('chat/', UserChatHistoryView.as_view(), name='user_chat'),
    path('chat/admin/threads/', AdminChatThreadsView.as_view(), name='admin_chat_threads'),
    path('chat/admin/thread/<int:user_id>/', AdminChatHistoryView.as_view(), name='admin_chat_history'),
    
    path('', include(router.urls)),
]
