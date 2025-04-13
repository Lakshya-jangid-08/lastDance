"""
ASGI config for jigyasa project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jigyasa_backend.settings')

application = get_asgi_application() 