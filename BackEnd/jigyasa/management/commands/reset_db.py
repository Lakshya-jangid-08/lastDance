from django.core.management.base import BaseCommand
from django.db import connection
import os

class Command(BaseCommand):
    help = 'Drops and recreates the database'

    def handle(self, *args, **kwargs):
        self.stdout.write('Dropping and recreating the database...')
        
        # Get database name from settings
        db_name = connection.settings_dict['NAME']
        
        # Close all connections
        connection.close()
        
        # Drop the database
        with connection.cursor() as cursor:
            cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
        
        # Create new database
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE {db_name}")
        
        self.stdout.write(self.style.SUCCESS('Successfully reset the database')) 