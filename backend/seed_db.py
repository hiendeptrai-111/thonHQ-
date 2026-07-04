import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from news.models import Category, Article

User = get_user_model()

def seed():
    # 1. Tạo superuser
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        admin.role = 'ADMIN'
        admin.save()
        print("Tạo tài khoản admin thành công (admin/admin123)")

    # 2. Tạo categories
    categories = ['Hoạt động Đoàn', 'Tuyên truyền', 'Sự kiện', 'Tình nguyện']
    cat_objs = {}
    for cat_name in categories:
        Category.objects.get_or_create(name=cat_name, defaults={'slug': cat_name.lower().replace(' ', '-')})

    print("Hoàn tất khởi tạo dữ liệu mẫu!")

if __name__ == '__main__':
    seed()
