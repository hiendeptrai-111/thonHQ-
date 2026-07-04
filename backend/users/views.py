from rest_framework import generics, viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import CustomTokenObtainPairSerializer, RegisterSerializer, UserSerializer, ChatMessageSerializer
from django.db import models

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'department', 'branch']
    ordering_fields = ['date_joined', 'is_active']

    def get_queryset(self):
        # Admin thấy tất cả user
        return User.objects.all().order_by('-date_joined')


import random
from django.core.mail import send_mail
from rest_framework.views import APIView
from .models import EmailVerification, PasswordResetCode, ChatMessage

class SendRegisterCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"detail": "Vui lòng nhập địa chỉ email."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"detail": "Email này đã được sử dụng bởi tài khoản khác."}, status=status.HTTP_400_BAD_REQUEST)

        code = str(random.randint(100000, 999999))
        EmailVerification.objects.update_or_create(
            email=email,
            defaults={'code': code}
        )

        subject = 'Mã xác minh đăng ký tài khoản - Đoàn thôn Hà Quảng Đông'
        message = f'Chào bạn,\n\nMã xác minh đăng ký tài khoản của bạn là: {code}\nMã xác minh này có hiệu lực trong vòng 5 phút.\n\nTrân trọng,\nBan Chấp Hành Đoàn thôn Hà Quảng Đông.'
        
        try:
            send_mail(subject, message, None, [email], fail_silently=False)
            return Response({"detail": "Mã xác minh đã được gửi thành công qua email của bạn."})
        except Exception as e:
            print("Email sending error:", e)
            return Response({"detail": "Lỗi khi gửi email xác thực. Vui lòng thử lại sau."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SendResetPasswordCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"detail": "Vui lòng nhập địa chỉ email."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "Không tìm thấy tài khoản nào liên kết với email này."}, status=status.HTTP_400_BAD_REQUEST)

        code = str(random.randint(100000, 999999))
        PasswordResetCode.objects.update_or_create(
            email=email,
            defaults={'code': code}
        )

        subject = 'Mã đặt lại mật khẩu - Đoàn thôn Hà Quảng Đông'
        message = f'Chào {user.username},\n\nBạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.\nMã xác minh đặt lại mật khẩu là: {code}\nMã xác minh này có hiệu lực trong vòng 5 phút.\n\nNếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\nTrân trọng,\nBan Chấp Hành Đoàn thôn Hà Quảng Đông.'
        
        try:
            send_mail(subject, message, None, [email], fail_silently=False)
            return Response({"detail": "Mã xác minh đặt lại mật khẩu đã được gửi đến email của bạn."})
        except Exception as e:
            print("Email sending error:", e)
            return Response({"detail": "Lỗi khi gửi email xác thực. Vui lòng thử lại sau."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('verification_code')
        new_password = request.data.get('new_password')

        if not email or not code or not new_password:
            return Response({"detail": "Thiếu thông tin yêu cầu."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reset_record = PasswordResetCode.objects.get(email=email)
        except PasswordResetCode.DoesNotExist:
            return Response({"detail": "Mã xác minh không chính xác hoặc chưa được gửi."}, status=status.HTTP_400_BAD_REQUEST)

        if reset_record.is_expired():
            reset_record.delete()
            return Response({"detail": "Mã xác minh đã hết hạn. Vui lòng lấy mã mới."}, status=status.HTTP_400_BAD_REQUEST)

        if reset_record.code != code:
            return Response({"detail": "Mã xác minh không chính xác."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            reset_record.delete()
            return Response({"detail": "Đặt lại mật khẩu thành công. Bạn đã có thể đăng nhập bằng mật khẩu mới."})
        except Exception as e:
            return Response({"detail": f"Lỗi khi cập nhật mật khẩu: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from django.utils import timezone

class UserChatHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Lấy lịch sử chat của đoàn viên hiện tại với Admin
        user = request.user
        messages = ChatMessage.objects.filter(
            models.Q(sender=user, receiver__isnull=True) |
            models.Q(sender__role='ADMIN', receiver=user)
        ).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        content = request.data.get('content')
        if not content:
            return Response({"detail": "Nội dung tin nhắn trống."}, status=status.HTTP_400_BAD_REQUEST)
        
        msg = ChatMessage.objects.create(
            sender=user,
            receiver=None, # NULL là tới Admin
            content=content
        )
        serializer = ChatMessageSerializer(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminChatThreadsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Quyền truy cập bị từ chối."}, status=status.HTTP_403_FORBIDDEN)
        
        # Lấy danh sách các User đã nhắn tin tới Admin (receiver=NULL) hoặc nhận phản hồi từ Admin
        senders = ChatMessage.objects.filter(receiver__isnull=True).values_list('sender', flat=True)
        receivers = ChatMessage.objects.filter(sender__role='ADMIN').values_list('receiver', flat=True)
        
        user_ids = set(list(senders) + list(receivers))
        users = User.objects.filter(id__in=user_ids).exclude(role='ADMIN')
        
        thread_data = []
        for u in users:
            last_msg = ChatMessage.objects.filter(
                models.Q(sender=u, receiver__isnull=True) |
                models.Q(sender__role='ADMIN', receiver=u)
            ).order_by('-created_at').first()
            
            thread_data.append({
                'user_id': u.id,
                'username': u.username,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'last_message': last_msg.content if last_msg else '',
                'last_message_sender': last_msg.sender.username if last_msg else '',
                'last_message_time': last_msg.created_at if last_msg else None
            })
            
        thread_data.sort(key=lambda x: x['last_message_time'] or timezone.now(), reverse=True)
        return Response(thread_data)


class AdminChatHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Quyền truy cập bị từ chối."}, status=status.HTTP_403_FORBIDDEN)
            
        messages = ChatMessage.objects.filter(
            models.Q(sender_id=user_id, receiver__isnull=True) |
            models.Q(sender__role='ADMIN', receiver_id=user_id)
        ).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, user_id):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Quyền truy cập bị từ chối."}, status=status.HTTP_403_FORBIDDEN)
            
        content = request.data.get('content')
        if not content:
            return Response({"detail": "Nội dung tin nhắn trống."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Người dùng không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
            
        msg = ChatMessage.objects.create(
            sender=request.user,
            receiver=target_user,
            content=content
        )
        serializer = ChatMessageSerializer(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
