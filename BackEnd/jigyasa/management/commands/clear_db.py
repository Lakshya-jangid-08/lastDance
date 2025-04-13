from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from jigyasa.models import Survey, Question, Choice, SurveyResponse, Answer, Organization, UserProfile

class Command(BaseCommand):
    help = 'Clears all data from the database'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing all data from the database...')
        
        # Delete all data in reverse order of dependencies
        Answer.objects.all().delete()
        SurveyResponse.objects.all().delete()
        Choice.objects.all().delete()
        Question.objects.all().delete()
        Survey.objects.all().delete()
        UserProfile.objects.all().delete()
        Organization.objects.all().delete()
        get_user_model().objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS('Successfully cleared all data from the database')) 