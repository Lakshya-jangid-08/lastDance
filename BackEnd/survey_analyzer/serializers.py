from rest_framework import serializers
from .models import CSVUpload, Analysis


class CSVUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CSVUpload
        fields = ['id', 'user', 'file', 'uploaded_at']
        read_only_fields = ['id', 'user', 'uploaded_at']


class AnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analysis
        fields = ['id', 'user', 'title', 'author_name', 'date', 'description', 'plots']
        read_only_fields = ['id', 'user', 'date']


class PlotDataSerializer(serializers.Serializer):
    plot_type = serializers.ChoiceField(choices=['scatter', 'bar', 'line', 'pie', 'histogram', 'heatmap', 'box', 'area'])
    x_axis = serializers.CharField(required=False, allow_blank=True)
    y_axes = serializers.ListField(child=serializers.CharField(), required=False)
    csv_upload_id = serializers.IntegerField()