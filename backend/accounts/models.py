from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    ACTIVITY_CHOICES = [
        ('sedentary', 'Sedentary (little/no exercise)'),
        ('light', 'Lightly active (light exercise 1-3 days/week)'),
        ('moderate', 'Moderately active (moderate exercise 3-5 days/week)'),
        ('very', 'Very active (hard exercise 6-7 days/week)'),
        ('extra', 'Extra active (very hard exercise, physical job)'),
    ]
    
    GOAL_CHOICES = [
        ('lose_weight', 'Lose Weight'),
        ('maintain_weight', 'Maintain Weight'),
        ('gain_weight', 'Gain Weight'),
        ('build_muscle', 'Build Muscle'),
        ('improve_health', 'Improve Overall Health'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Physical Information
    age = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(13), MaxValueValidator(120)]
    )
    weight = models.FloatField(null=True, blank=True, help_text="Weight in kg")
    height = models.FloatField(null=True, blank=True, help_text="Height in cm")
    gender = models.CharField(
        max_length=10,
        choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
        blank=True
    )
    
    # Lifestyle Information
    activity_level = models.CharField(
        max_length=20,
        choices=ACTIVITY_CHOICES,
        default='moderate'
    )
    primary_goal = models.CharField(
        max_length=20,
        choices=GOAL_CHOICES,
        default='improve_health'
    )
    
    # Nutrition Goals
    daily_calorie_goal = models.PositiveIntegerField(null=True, blank=True)
    daily_protein_goal = models.FloatField(null=True, blank=True)
    daily_carbs_goal = models.FloatField(null=True, blank=True)
    daily_fat_goal = models.FloatField(null=True, blank=True)
    
    # Preferences
    dietary_restrictions = models.JSONField(default=list, blank=True)
    allergies = models.JSONField(default=list, blank=True)
    
    # Profile completion
    is_profile_complete = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    def calculate_bmr(self):
        """Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation"""
        if not all([self.weight, self.height, self.age, self.gender]):
            return None
            
        if self.gender == 'male':
            bmr = (10 * self.weight) + (6.25 * self.height) - (5 * self.age) + 5
        else:
            bmr = (10 * self.weight) + (6.25 * self.height) - (5 * self.age) - 161
            
        return round(bmr, 2)
    
    def calculate_daily_calories(self):
        """Calculate daily calorie needs based on activity level"""
        bmr = self.calculate_bmr()
        if not bmr:
            return None
            
        multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'very': 1.725,
            'extra': 1.9
        }
        
        return round(bmr * multipliers.get(self.activity_level, 1.55), 2)
    
    def calculate_macro_goals(self):
        """Calculate macro goals based on primary goal"""
        daily_calories = self.calculate_daily_calories()
        if not daily_calories:
            return None
        
        # Adjust calories based on goal
        if self.primary_goal == 'lose_weight':
            daily_calories -= 500  # Deficit for weight loss
        elif self.primary_goal in ['gain_weight', 'build_muscle']:
            daily_calories += 500  # Surplus for weight gain
        
        # Calculate macros based on goal
        if self.primary_goal == 'build_muscle':
            # High protein
            protein_ratio = 0.35
            carbs_ratio = 0.40
            fat_ratio = 0.25
        elif self.primary_goal == 'lose_weight':
            # Moderate protein, lower carbs
            protein_ratio = 0.30
            carbs_ratio = 0.35
            fat_ratio = 0.35
        else:
            # Balanced
            protein_ratio = 0.25
            carbs_ratio = 0.45
            fat_ratio = 0.30
        
        return {
            'calories': round(daily_calories),
            'protein': round((daily_calories * protein_ratio) / 4),  # 4 cal per gram
            'carbs': round((daily_calories * carbs_ratio) / 4),
            'fat': round((daily_calories * fat_ratio) / 9),  # 9 cal per gram
        }
    
    def update_goals(self):
        """Auto-calculate and update nutrition goals"""
        goals = self.calculate_macro_goals()
        if goals:
            self.daily_calorie_goal = goals['calories']
            self.daily_protein_goal = goals['protein']
            self.daily_carbs_goal = goals['carbs']
            self.daily_fat_goal = goals['fat']
            self.save()

# Signal to auto-create profile when user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        print(f"Profile created for user: {instance.username}")

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()