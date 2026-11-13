import os
import django

# Эти две строки критически важны:
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vesutil.settings')
django.setup()

# Только после этого можно импортировать модели:
from core.models import User
