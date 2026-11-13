import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vesutil.settings')
django.setup()

from core.models import User

username = 'admin'
email = 'vesutil@mail.ru'
password = 'admin12345'

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f'✅ Пользователь {username} создан с паролем {password}')
else:
    user = User.objects.get(username=username)
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.save()
    print(f'🔄 Пользователь {username} уже существовал. Пароль сброшен на {password}')
