from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.MealViewSet, basename='meal')
router.register(r'recommendations', views.RecommendationViewSet, basename='recommendation')

urlpatterns = [
    path('analyze/', views.analyze_meal_json, name='analyze_meal'),
    path('daily_summary/', views.daily_summary_json, name='daily_summary'),
    path('progress/weekly/', views.progress_weekly_json, name='progress_weekly'),
    path('progress/monthly/', views.progress_monthly_json, name='progress_monthly'),
    path('', views.meals_list_json, name='meals_list'),
]