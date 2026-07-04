from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Thêm các claim tuỳ chỉnh
        token['role'] = user.role
        token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Thêm thông tin vào response trả về
        data['role'] = self.user.role
        data['username'] = self.user.username
        data['id'] = self.user.id
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'department', 'branch', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    verification_code = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'department', 'branch', 'verification_code']

    def validate(self, attrs):
        email = attrs.get('email')
        code = attrs.get('verification_code')

        # Check email uniquely
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email này đã được sử dụng bởi một đoàn viên khác."})

        from .models import EmailVerification
        try:
            verif = EmailVerification.objects.get(email=email)
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError({"verification_code": "Mã xác minh chưa được gửi hoặc không tồn tại."})

        if verif.is_expired():
            verif.delete()
            raise serializers.ValidationError({"verification_code": "Mã xác minh đã hết hạn. Vui lòng gửi lại mã mới."})

        if verif.code != code:
            raise serializers.ValidationError({"verification_code": "Mã xác minh không chính xác."})

        return attrs

    def create(self, validated_data):
        # Delete verification record on success
        from .models import EmailVerification
        EmailVerification.objects.filter(email=validated_data['email']).delete()

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            department=validated_data.get('department', ''),
            branch=validated_data.get('branch', ''),
            role='USER'
        )
        return user


from .models import ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True, default='Admin')

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_name', 'receiver', 'receiver_name', 'content', 'created_at']
