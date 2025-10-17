from django.urls import path
from . import views

urlpatterns = [
    path('analyze/', views.NutritionAnalysisView.as_view(), name='nutrition_analyze'),
]