from django.urls import path
from rest_framework.routers import SimpleRouter
from . import views

# Recommendations router must come first — the empty-prefix MealViewSet router
# generates a catch-all detail pattern that would shadow /recommendations/ otherwise.
rec_router = SimpleRouter()
rec_router.register(r'recommendations', views.RecommendationViewSet, basename='recommendation')

meal_router = SimpleRouter()
meal_router.register(r'', views.MealViewSet, basename='meal')

urlpatterns = [
    path('analyze/', views.analyze_meal_json, name='analyze_meal'),
    path('daily_summary/', views.daily_summary_json, name='daily_summary'),
    path('barcode/', views.barcode_lookup, name='barcode_lookup'),
    path('progress/weekly/', views.progress_weekly_json, name='progress_weekly'),
    path('progress/monthly/', views.progress_monthly_json, name='progress_monthly'),
] + rec_router.urls + meal_router.urls
