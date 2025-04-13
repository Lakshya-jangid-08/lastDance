from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CSVUploadViewSet, AnalysisViewSet, PlotDataView, GroupByView, PublishAnalysisView

router = DefaultRouter()
router.register(r'csv-uploads', CSVUploadViewSet, basename='csv-upload')
router.register(r'analyses', AnalysisViewSet, basename='analysis')

urlpatterns = [
    path('plot-data/', PlotDataView.as_view(), name='plot-data'),
    path('groupby/', GroupByView.as_view(), name='groupby'),
    path('', include(router.urls)),
    path('publish-analysis/', PublishAnalysisView.as_view(), name='publish-analysis'),
]