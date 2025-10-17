from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Food(models.Model):
    """Food database with nutrition information"""
    name = models.CharField(max_length=200, unique=True)
    
    # Nutrition per 100g
    calories_per_100g = models.FloatField()
    protein_per_100g = models.FloatField(default=0)
    carbs_per_100g = models.FloatField(default=0)
    fat_per_100g = models.FloatField(default=0)
    fiber_per_100g = models.FloatField(default=0)
    sugar_per_100g = models.FloatField(default=0)
    
    # Micronutrients (optional)
    sodium_per_100g = models.FloatField(default=0, help_text="mg")
    calcium_per_100g = models.FloatField(default=0, help_text="mg")
    iron_per_100g = models.FloatField(default=0, help_text="mg")
    vitamin_c_per_100g = models.FloatField(default=0, help_text="mg")
    
    # Data sources
    usda_id = models.CharField(max_length=50, null=True, blank=True)
    edamam_id = models.CharField(max_length=100, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class Meal(models.Model):
    """Individual meal logged by user"""
    MEAL_TYPES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meals')
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPES)
    description = models.TextField(help_text="User's description of the meal")
    
    # AI Analysis Results
    total_calories = models.FloatField(null=True, blank=True)
    total_protein = models.FloatField(null=True, blank=True)
    total_carbs = models.FloatField(null=True, blank=True)
    total_fat = models.FloatField(null=True, blank=True)
    total_fiber = models.FloatField(null=True, blank=True)
    
    # AI Metadata
    ai_confidence = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        null=True, blank=True,
        help_text="AI confidence score (0-1)"
    )
    ai_analysis_raw = models.JSONField(null=True, blank=True)
    
    # Timestamps
    logged_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.meal_type} - {self.logged_at.strftime('%Y-%m-%d')}"

    class Meta:
        ordering = ['-logged_at']

class MealFood(models.Model):
    """Individual food items within a meal (parsed by AI)"""
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name='foods')
    food = models.ForeignKey(Food, on_delete=models.CASCADE)
    quantity_grams = models.FloatField()
    
    # Calculated nutrition for this portion
    calories = models.FloatField()
    protein = models.FloatField()
    carbs = models.FloatField()
    fat = models.FloatField()

    def save(self, *args, **kwargs):
        # Calculate nutrition based on quantity
        ratio = self.quantity_grams / 100
        self.calories = self.food.calories_per_100g * ratio
        self.protein = self.food.protein_per_100g * ratio
        self.carbs = self.food.carbs_per_100g * ratio
        self.fat = self.food.fat_per_100g * ratio
        super().save(*args, **kwargs)

class Recommendation(models.Model):
    """AI-generated recommendations for users"""
    RECOMMENDATION_TYPES = [
        ('nutrient_gap', 'Nutrient Gap'),
        ('food_suggestion', 'Food Suggestion'),
        ('meal_timing', 'Meal Timing'),
        ('portion_size', 'Portion Size'),
        ('goal_progress', 'Goal Progress'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, null=True, blank=True)
    
    recommendation_type = models.CharField(max_length=20, choices=RECOMMENDATION_TYPES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    
    confidence_score = models.FloatField(default=0.8)
    is_read = models.BooleanField(default=False)
    is_helpful = models.BooleanField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"

    class Meta:
        ordering = ['-created_at']

class DailyProgress(models.Model):
    """Track daily nutrition progress"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_progress')
    date = models.DateField()
    
    # Actual totals
    total_calories = models.FloatField(default=0)
    total_protein = models.FloatField(default=0)
    total_carbs = models.FloatField(default=0)
    total_fat = models.FloatField(default=0)
    total_fiber = models.FloatField(default=0)
    
    # Goals (snapshot from profile at time of tracking)
    goal_calories = models.PositiveIntegerField(null=True, blank=True)
    goal_protein = models.FloatField(null=True, blank=True)
    goal_carbs = models.FloatField(null=True, blank=True)
    goal_fat = models.FloatField(null=True, blank=True)
    
    # Metrics
    meals_count = models.PositiveIntegerField(default=0)
    adherence_score = models.FloatField(default=0)  # 0-100%
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.date}"
    
    def calculate_adherence(self):
        """Calculate how well user met their goals (0-100%)"""
        if not self.goal_calories:
            return 0
        
        # Calculate percentage of goal met for each macro
        cal_adherence = min(100, (self.total_calories / self.goal_calories) * 100) if self.goal_calories else 0
        
        protein_adherence = 100
        if self.goal_protein:
            protein_adherence = min(100, (self.total_protein / self.goal_protein) * 100)
        
        # Average adherence (can be weighted differently)
        adherence = (cal_adherence + protein_adherence) / 2
        
        # Penalize if going too far over calorie goal
        if self.total_calories > self.goal_calories * 1.2:
            adherence *= 0.8
        
        self.adherence_score = round(adherence, 1)
        return self.adherence_score