import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from news.models import Article, Category
from django.contrib.auth import get_user_model
User = get_user_model()

admin = User.objects.get(username='admin')
category = Category.objects.first()

try:
    article = Article.objects.get(id=1)
    article.title = "Updated Title"
    article.save()
    print("Article 1 updated successfully")
except Exception as e:
    print(f"Error updating article 1: {e}")

