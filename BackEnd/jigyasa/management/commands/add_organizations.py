from django.core.management.base import BaseCommand
from jigyasa.models import Organization

class Command(BaseCommand):
    help = 'Adds default organizations to the database'

    def handle(self, *args, **kwargs):
        organizations = [
            'IIITV',
            'IITGN',
            'GEC',
            'NIT Surat',
            'SVNIT',
            'GEC Modasa',
            'GEC Patan',
            'GEC Rajkot',
            'GEC Bhavnagar',
            'GEC Bhuj',
            'GEC Godhra',
            'GEC Junagadh',
            'GEC Palanpur',
            'GEC Porbandar',
            'GEC Vapi',
            'GEC Valsad',
            'GEC Vapi',
            'GEC Valsad',
            'GEC Vapi',
            'GEC Valsad',
        ]

        for org_name in organizations:
            Organization.objects.get_or_create(name=org_name)
            self.stdout.write(self.style.SUCCESS(f'Successfully added organization: {org_name}')) 