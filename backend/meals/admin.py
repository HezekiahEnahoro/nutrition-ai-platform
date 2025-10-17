from django.contrib import admin
from .models import Meal, Food, MealFood, Recommendation

@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ['name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fat_per_100g']
    search_fields = ['name']
    list_filter = ['created_at']

@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ['user', 'meal_type', 'description', 'total_calories', 'logged_at']
    list_filter = ['meal_type', 'logged_at']
    search_fields = ['user__username', 'description']
    readonly_fields = ['logged_at', 'ai_confidence']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'meal_type', 'description', 'logged_at')
        }),
        ('Nutrition Analysis', {
            'fields': ('total_calories', 'total_protein', 'total_carbs', 'total_fat', 'total_fiber')
        }),
        ('AI Metadata', {
            'fields': ('ai_confidence', 'ai_analysis_raw')
        })
    )

@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'recommendation_type', 'confidence_score', 'is_read', 'created_at']
    list_filter = ['recommendation_type', 'is_read', 'created_at']
    search_fields = ['user__username', 'title', 'content']