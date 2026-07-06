from rest_framework import viewsets, permissions, filters
from .models import Category, Tag, Article, Comment, Notification, Idea, ArticleImage
from .serializers import CategorySerializer, TagSerializer, ArticleSerializer, CommentSerializer, NotificationSerializer, IdeaSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().order_by('-is_pinned', '-created_at')
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'category__name', 'tags__name']
    ordering_fields = ['is_pinned', 'created_at', 'views']

    def perform_create(self, serializer):
        article = serializer.save(author=self.request.user)
        additional_images = self.request.FILES.getlist('additional_images')
        for img in additional_images:
            ArticleImage.objects.create(article=article, image=img)

    def perform_update(self, serializer):
        article = serializer.save()
        clear_existing = self.request.data.get('clear_existing_images') == 'true'
        if clear_existing:
            article.additional_images.all().delete()
            
        additional_images = self.request.FILES.getlist('additional_images')
        for img in additional_images:
            ArticleImage.objects.create(article=article, image=img)

    def create(self, request, *args, **kwargs):
        send_notification = request.data.get('send_notification')
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            article_id = response.data.get('id')
            article_title = response.data.get('title', '')
            if send_notification == True or send_notification == 'true':
                try:
                    Notification.objects.create(
                        title=f"Tin mới: {article_title}"[:250],
                        content=f"Có bài viết mới được đăng tải: \"{article_title}\". Nhấp vào để đọc ngay.",
                        target_url=f"/article/{article_id}"
                    )
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).error(f"Failed to create notification: {e}")
        return response

    def update(self, request, *args, **kwargs):
        send_notification = request.data.get('send_notification')
        response = super().update(request, *args, **kwargs)
        if response.status_code == 200:
            article_id = response.data.get('id')
            article_title = response.data.get('title', '')
            if send_notification == True or send_notification == 'true':
                try:
                    Notification.objects.create(
                        title=f"Cập nhật: {article_title}"[:250],
                        content=f"Bài viết \"{article_title}\" đã có cập nhật mới. Nhấp vào để xem chi tiết.",
                        target_url=f"/article/{article_id}"
                    )
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).error(f"Failed to create notification: {e}")
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny], url_path='increment-view')
    def increment_view(self, request, pk=None):
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])
        return Response({"views": instance.views})

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
        
    def get_queryset(self):
        # Admin thấy toàn bộ bình luận, người dùng thường chỉ thấy bình luận không bị ẩn
        if self.request.user and self.request.user.is_authenticated and self.request.user.role == 'ADMIN':
            return Comment.objects.all().order_by('-created_at')
        return Comment.objects.filter(is_hidden=False).order_by('-created_at')


from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Sum

User = get_user_model()

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Quyền truy cập bị từ chối."}, status=403)
            
        total_users = User.objects.count()
        total_articles = Article.objects.count()
        total_views = Article.objects.aggregate(total=Sum('views'))['total'] or 0
        total_comments = Comment.objects.count()
        
        # Lấy 5 bài viết có lượng xem cao nhất
        recent_articles = Article.objects.all().order_by('-views')[:5]
        recent_data = ArticleSerializer(recent_articles, many=True, context={'request': request}).data
        
        return Response({
            "total_users": total_users,
            "total_articles": total_articles,
            "total_views": total_views,
            "total_comments": total_comments,
            "recent_articles": recent_data
        })


from .models import Poll, PollOption, Vote
from .serializers import PollSerializer, PollOptionSerializer
from rest_framework import status
from django.utils import timezone

class PollViewSet(viewsets.ModelViewSet):
    queryset = Poll.objects.all().order_by('-created_at')
    serializer_class = PollSerializer
    permission_classes = [IsAdminOrReadOnly]

    def create(self, request, *args, **kwargs):
        from django.utils.dateparse import parse_datetime
        data = request.data
        question = data.get('question')
        expires_at = data.get('expires_at')
        options = data.get('options', [])
        send_notification = data.get('send_notification')

        if not question or not options:
            return Response({"detail": "Thiếu câu hỏi hoặc phương án bình chọn."}, status=400)

        parsed_expires_at = None
        if expires_at:
            parsed_expires_at = parse_datetime(expires_at)

        poll = Poll.objects.create(
            question=question,
            expires_at=parsed_expires_at,
            is_active=data.get('is_active', True)
        )

        for opt_text in options:
            PollOption.objects.create(poll=poll, option_text=opt_text)

        if send_notification == True or send_notification == 'true':
            Notification.objects.create(
                title=f"Biểu quyết mới: {question}",
                content=f"Chi Đoàn phát động cuộc khảo sát/bình chọn ý kiến mới: \"{question}\". Hãy tham gia đóng góp tiếng nói của bạn.",
                target_url="/polls"
            )

        serializer = self.get_serializer(poll)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        from django.utils.dateparse import parse_datetime
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data
        send_notification = data.get('send_notification')

        # Parse expires_at if present in update data
        if 'expires_at' in data and data['expires_at']:
            data = data.copy()
            data['expires_at'] = parse_datetime(data['expires_at'])

        options = data.get('options')
        if options is not None:
            if instance.votes.exists():
                return Response({"detail": "Không thể chỉnh sửa các phương án vì cuộc bình chọn đã có lượt bỏ phiếu."}, status=400)
            
            instance.options.all().delete()
            for opt_text in options:
                PollOption.objects.create(poll=instance, option_text=opt_text)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if send_notification == True or send_notification == 'true':
            Notification.objects.create(
                title=f"Cập nhật bình chọn: {instance.question}",
                content=f"Thông tin cuộc bình chọn \"{instance.question}\" đã được cập nhật. Hãy kiểm tra ngay.",
                target_url="/polls"
            )

        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def vote(self, request, pk=None):
        poll = self.get_object()
        option_id = request.data.get('option_id')

        if not option_id:
            return Response({"detail": "Vui lòng chọn phương án bình chọn."}, status=status.HTTP_400_BAD_REQUEST)

        if not poll.is_active:
            return Response({"detail": "Cuộc bình chọn này đã bị khóa."}, status=status.HTTP_400_BAD_REQUEST)
        if poll.expires_at and timezone.now() > poll.expires_at:
            return Response({"detail": "Cuộc bình chọn này đã hết hạn."}, status=status.HTTP_400_BAD_REQUEST)

        if poll.votes.filter(user=request.user).exists():
            return Response({"detail": "Bạn đã thực hiện bình chọn cho câu hỏi này rồi."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            option = poll.options.get(id=option_id)
        except PollOption.DoesNotExist:
            return Response({"detail": "Phương án bình chọn không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        Vote.objects.create(user=request.user, poll=poll, option=option)
        
        serializer = self.get_serializer(poll)
        return Response(serializer.data)


from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminOrReadOnly]


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'


class IdeaViewSet(viewsets.ModelViewSet):
    queryset = Idea.objects.all().order_by('-created_at')
    serializer_class = IdeaSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
