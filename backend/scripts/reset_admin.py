import os

import django


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User


try:
    user = User.objects.get(username='admin')
    user.set_password('admin123')
    user.save()
    print("Password for 'admin' has been reset to 'admin123'")
except User.DoesNotExist:
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("Superuser 'admin' created with password 'admin123'")
