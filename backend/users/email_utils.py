"""
Tiện ích gửi email qua Brevo HTTP API.

Render gói miễn phí chặn hoàn toàn cổng SMTP (587/465), nên không thể dùng
Django send_mail() với Gmail SMTP trên production.

Giải pháp: dùng Brevo (brevo.com) gửi email qua HTTP API (cổng 443 - HTTPS),
hoàn toàn miễn phí 300 email/ngày.
"""

import json
import os
import urllib.request
import urllib.error
from django.core.mail import send_mail as django_send_mail


def send_email(to_email, subject, text_content):
    """
    Gửi email thông minh:
    1. Nếu có BREVO_API_KEY → gửi qua Brevo HTTP API (cho Render production)
    2. Nếu không → gửi qua Django send_mail (cho local dev với Gmail SMTP)
    """
    brevo_api_key = os.environ.get('BREVO_API_KEY', '')

    if brevo_api_key:
        return _send_via_brevo(to_email, subject, text_content, brevo_api_key)
    else:
        # Fallback: dùng Django send_mail (hoạt động trên local với Gmail SMTP)
        django_send_mail(subject, text_content, None, [to_email], fail_silently=False)
        return True


def _send_via_brevo(to_email, subject, text_content, api_key):
    """Gửi email qua Brevo (Sendinblue) transactional HTTP API."""
    sender_email = os.environ.get('EMAIL_HOST_USER', 'noreply@example.com')
    sender_name = 'Chi Đoàn Hà Quãng'

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json",
    }
    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "textContent": text_content,
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            if response.status in (200, 201):
                print(f"Brevo: Email sent successfully to {to_email}")
                return True
            else:
                body = response.read().decode('utf-8')
                raise Exception(f"Brevo API returned status {response.status}: {body}")
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        raise Exception(f"Brevo API error {e.code}: {body}")
