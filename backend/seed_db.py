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
        cat, created = Category.objects.get_or_create(name=cat_name, defaults={'slug': cat_name.lower().replace(' ', '-')})
        cat_objs[cat_name] = cat
        if created:
            print(f"Tạo chuyên mục: {cat_name}")

    # 3. Tạo bài viết mẫu
    articles = [
        {
            'title': 'Đoàn viên thanh niên ra quân Chiến dịch Mùa Hè Xanh 2026',
            'category': 'Tình nguyện',
            'content': 'Sáng nay, hàng trăm đoàn viên thanh niên xã Hà Quãng Đông đã chính thức ra quân Chiến dịch Mùa Hè Xanh 2026 với tinh thần nhiệt huyết, sẵn sàng cống hiến vì cộng đồng. Các hoạt động chính bao gồm dọn dẹp vệ sinh môi trường, hỗ trợ trẻ em khó khăn và tổ chức các lớp học tình thương.',
            'is_pinned': True,
        },
        {
            'title': 'Hội thảo: Nâng cao năng lực số cho sinh viên thời đại mới',
            'category': 'Sự kiện',
            'content': 'Nhằm trang bị kỹ năng cần thiết cho đoàn viên, Đoàn xã đã tổ chức buổi hội thảo chuyên đề về chuyển đổi số và ứng dụng AI. Hơn 200 bạn trẻ đã tham dự và thảo luận sôi nổi về các cơ hội cũng như thách thức trong kỷ nguyên 4.0.',
            'is_pinned': False,
        },
        {
            'title': 'Tuyên dương 100 gương mặt trẻ tiêu biểu có thành tích xuất sắc',
            'category': 'Tuyên truyền',
            'content': 'Nhân dịp kỷ niệm ngày thành lập Đoàn, BCH Đoàn đã tổ chức lễ tuyên dương 100 thanh niên có thành tích xuất sắc trong học tập và rèn luyện. Đây là những tấm gương sáng để các bạn trẻ khác noi theo.',
            'is_pinned': False,
        }
    ]

    admin_user = User.objects.get(username='admin')
    for i, art in enumerate(articles):
        if not Article.objects.filter(title=art['title']).exists():
            Article.objects.create(
                title=art['title'],
                slug=f"bai-viet-mau-{i}",
                content=art['content'],
                category=cat_objs[art['category']],
                author=admin_user,
                is_published=True,
                is_pinned=art['is_pinned']
            )
            print(f"Tạo bài viết: {art['title']}")

    print("Hoàn tất khởi tạo dữ liệu mẫu!")

if __name__ == '__main__':
    seed()
