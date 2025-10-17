from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta
from .models import Meal, DailyProgress

class ProgressTrackingService:
    """Service to calculate and track daily progress"""
    
    @staticmethod
    def update_daily_progress(user, date=None):
        """Calculate and update daily progress for a given date"""
        if date is None:
            date = timezone.now().date()
        
        # Get all meals for the day
        meals = Meal.objects.filter(
            user=user,
            logged_at__date=date
        )
        
        # Calculate totals
        totals = meals.aggregate(
            total_calories=Sum('total_calories'),
            total_protein=Sum('total_protein'),
            total_carbs=Sum('total_carbs'),
            total_fat=Sum('total_fat'),
            total_fiber=Sum('total_fiber'),
        )
        
        # Get user's goals
        profile = user.profile
        
        # Create or update daily progress
        progress, created = DailyProgress.objects.update_or_create(
            user=user,
            date=date,
            defaults={
                'total_calories': totals['total_calories'] or 0,
                'total_protein': totals['total_protein'] or 0,
                'total_carbs': totals['total_carbs'] or 0,
                'total_fat': totals['total_fat'] or 0,
                'total_fiber': totals['total_fiber'] or 0,
                'goal_calories': profile.daily_calorie_goal,
                'goal_protein': profile.daily_protein_goal,
                'goal_carbs': profile.daily_carbs_goal,
                'goal_fat': profile.daily_fat_goal,
                'meals_count': meals.count(),
            }
        )
        
        progress.calculate_adherence()
        progress.save()
        
        return progress
    
    @staticmethod
    def get_weekly_progress(user):
        """Get progress for the last 7 days"""
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        
        progress_records = DailyProgress.objects.filter(
            user=user,
            date__gte=week_ago,
            date__lte=today
        ).order_by('date')
        
        return list(progress_records)
    
    @staticmethod
    def get_monthly_progress(user):
        """Get progress for the last 30 days"""
        today = timezone.now().date()
        month_ago = today - timedelta(days=30)
        
        progress_records = DailyProgress.objects.filter(
            user=user,
            date__gte=month_ago,
            date__lte=today
        ).order_by('date')
        
        return list(progress_records)
    
    @staticmethod
    def get_progress_summary(user, days=7):
        """Get summary statistics for the period"""
        today = timezone.now().date()
        start_date = today - timedelta(days=days)
        
        progress_records = DailyProgress.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=today
        )
        
        if not progress_records.exists():
            return None
        
        avg_calories = progress_records.aggregate(avg=Sum('total_calories'))['avg'] / days
        avg_protein = progress_records.aggregate(avg=Sum('total_protein'))['avg'] / days
        avg_adherence = progress_records.aggregate(avg=Sum('adherence_score'))['avg'] / days
        
        return {
            'period_days': days,
            'avg_calories': round(avg_calories, 1) if avg_calories else 0,
            'avg_protein': round(avg_protein, 1) if avg_protein else 0,
            'avg_adherence': round(avg_adherence, 1) if avg_adherence else 0,
            'days_tracked': progress_records.count(),
        }