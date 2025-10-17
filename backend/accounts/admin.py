from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'age', 'weight', 'height', 'activity_level', 'primary_goal']
    list_filter = ['activity_level', 'primary_goal', 'gender']
    search_fields = ['user__username', 'user__email']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Physical Information', {
            'fields': ('age', 'weight', 'height', 'gender')
        }),
        ('Goals & Lifestyle', {
            'fields': ('activity_level', 'primary_goal')
        }),
        ('Nutrition Targets', {
            'fields': ('daily_calorie_goal', 'daily_protein_goal', 'daily_carbs_goal', 'daily_fat_goal')
        }),
        ('Dietary Preferences', {
            'fields': ('dietary_restrictions', 'allergies')
        })
    )