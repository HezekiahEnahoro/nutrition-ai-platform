from rest_framework import serializers
from .models import Meal, Food, MealFood, Recommendation

class FoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = [
            'id', 'name', 'calories_per_100g', 'protein_per_100g',
            'carbs_per_100g', 'fat_per_100g', 'fiber_per_100g'
        ]

class MealFoodSerializer(serializers.ModelSerializer):
    food = FoodSerializer(read_only=True)
    
    class Meta:
        model = MealFood
        fields = ['id', 'food', 'quantity_grams', 'calories', 'protein', 'carbs', 'fat']

class MealSerializer(serializers.ModelSerializer):
    foods = MealFoodSerializer(many=True, read_only=True)
    
    class Meta:
        model = Meal
        fields = [
            'id', 'meal_type', 'description', 'logged_at',
            'total_calories', 'total_protein', 'total_carbs', 
            'total_fat', 'total_fiber', 'ai_confidence', 'foods'
        ]
        read_only_fields = ['logged_at', 'total_calories', 'total_protein', 
                           'total_carbs', 'total_fat', 'total_fiber', 'ai_confidence']

class MealCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meal
        fields = ['meal_type', 'description']

class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = [
            'id', 'recommendation_type', 'title', 'content',
            'confidence_score', 'is_read', 'is_helpful', 'created_at'
        ]