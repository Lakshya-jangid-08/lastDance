from django.db import models
from django.conf import settings
import os


def upload_to(instance, filename):
    return os.path.join('uploads', 'csv', str(instance.user.id), filename)


class CSVUpload(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file = models.FileField(upload_to=upload_to)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class Analysis(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default='Untitled Analysis')
    author_name = models.CharField(max_length=255, default='Unknown Author')
    date = models.DateField(auto_now_add=True, null=True)
    description = models.TextField(blank=True, null=True)
    plots = models.JSONField(default=list)  # Store plot configurations and data

    def __str__(self):
        return this.title


class Plot(models.Model):
    analysis = models.ForeignKey('Analysis', related_name='related_plots', on_delete=models.CASCADE)
    type = models.CharField(max_length=255)
    data = models.TextField()  # Store plot data as JSON or plain text

    def __str__(self):
        return f"{self.type} Plot for {self.analysis.title}"
