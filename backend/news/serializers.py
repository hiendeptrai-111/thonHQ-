from rest_framework import serializers
from .models import Category, Tag, Article, Comment, ArticleImage
from users.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'department', 'branch']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    article_title = serializers.CharField(source='article.title', read_only=True)
    parent_author = serializers.CharField(source='parent.author.username', read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'author_name', 'content', 'parent', 'parent_author', 'replies', 'article', 'article_title', 'is_hidden', 'created_at']
        read_only_fields = ['author']

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []

class ArticleImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleImage
        fields = ['id', 'image', 'created_at']

class ArticleSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    comments = serializers.SerializerMethodField()
    additional_images = ArticleImageSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = '__all__'
        read_only_fields = ['author', 'views', 'slug']

    def get_comments(self, obj):
        # Lấy bình luận gốc (không có parent)
        comments = obj.comments.filter(parent__isnull=True, is_hidden=False)
        return CommentSerializer(comments, many=True).data


from django.utils import timezone
from .models import Poll, PollOption, Vote

class PollOptionSerializer(serializers.ModelSerializer):
    votes_count = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ['id', 'option_text', 'votes_count']

    def get_votes_count(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated and request.user.role == 'ADMIN':
            return Vote.objects.filter(option=obj).count()
        return None


class PollSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True, read_only=True)
    total_votes = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()
    selected_option_id = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = ['id', 'question', 'created_at', 'expires_at', 'is_active', 'options', 'total_votes', 'has_voted', 'selected_option_id', 'is_expired']

    def get_total_votes(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated and request.user.role == 'ADMIN':
            return obj.votes.count()
        return None

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.votes.filter(user=request.user).exists()
        return False

    def get_selected_option_id(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            return vote.option.id if vote else None
        return None

    def get_is_expired(self, obj):
        if obj.expires_at:
            expires = obj.expires_at
            if isinstance(expires, str):
                from django.utils.dateparse import parse_datetime
                expires = parse_datetime(expires)
            if expires:
                return timezone.now() > expires
        return False


from .models import Notification, Idea

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class IdeaSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_full_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Idea
        fields = ['id', 'title', 'content', 'author', 'author_name', 'author_full_name', 'created_at']
        read_only_fields = ['author']

    def get_author_full_name(self, obj):
        return f"{obj.author.last_name} {obj.author.first_name}".strip() or obj.author.username
