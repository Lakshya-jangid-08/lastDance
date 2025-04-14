#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jigyasa_backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

def reset_database():
    """Delete the existing database and create a new one."""
    db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')
    if os.path.exists(db_path):
        os.remove(db_path)
        print("Database deleted successfully.")
    else:
        print("No database found to delete.")
    os.system('python manage.py migrate')
    print("New database created successfully.")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'reset_db':
        reset_database()
    else:
        main()
