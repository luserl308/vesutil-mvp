import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vesutil.settings')
django.setup()

from core.models import User

username = 'admin'
email = 'vesutil@mail.ru'
password = 'admin12345'

user, created = User.objects.get_or_create(username=username)
user.email = email
user.set_password(password)
user.is_superuser = True
user.is_staff = True
user.is_active = True
user.save()

if created:
    print(f'✅ Пользователь {username} создан с паролем {password}')
else:
    print(f'🔄 Пользователь {username} обновлен. Пароль: {password}')
