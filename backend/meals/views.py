from django.http import JsonResponse
import logging
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from django.utils.decorators import method_decorator
from .models import Meal, Recommendation
from .serializers import (
    MealSerializer, 
    MealCreateSerializer, 
    RecommendationSerializer
)
from django.contrib.sessions.models import Session

# Add logger
logger = logging.getLogger(__name__)

class MealViewSet(viewsets.ModelViewSet):
    serializer_class = MealSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Meal.objects.filter(user=self.request.user).order_by('-logged_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return MealCreateSerializer
        return MealSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@csrf_exempt
def analyze_meal_json(request):
    if request.method == 'POST':
        # Authentication
        user = None
        sessionid = request.COOKIES.get('sessionid')
        
        if sessionid:
            from django.contrib.sessions.models import Session
            from django.contrib.auth.models import User
            try:
                session = Session.objects.get(session_key=sessionid)
                user_id = session.get_decoded().get('_auth_user_id')
                if user_id:
                    user = User.objects.get(id=user_id)
            except (Session.DoesNotExist, User.DoesNotExist):
                pass
        
        if not user:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        import json
        try:
            data = json.loads(request.body)
            meal_description = data.get('description', '').strip()
            meal_type = data.get('meal_type', 'snack')
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        if not meal_description:
            return JsonResponse({'error': 'Meal description required'}, status=400)
        
        try:
            # Parse meal into food items
            from nutrition.meal_parser import MealParser
            from nutrition.ai_service import NutritionAI
            
            parsed_foods = MealParser.parse_meal(meal_description)
            print(f"Parsed foods: {parsed_foods}")
            
            # Analyze with AI
            ai = NutritionAI()
            analysis = ai.analyze_meal(meal_description, parsed_foods)
            
            # Create meal record
            meal = Meal.objects.create(
                user=user,
                description=meal_description,
                meal_type=meal_type,
                total_calories=analysis['calories'],
                total_protein=analysis['protein'],
                total_carbs=analysis['carbs'],
                total_fat=analysis['fat'],
                total_fiber=analysis['fiber'],
                ai_confidence=analysis['confidence_score']
            )

             # Update daily progress
            from .services import ProgressTrackingService
            from django.utils import timezone
            
            today = timezone.now().date()
            progress = ProgressTrackingService.update_daily_progress(user, today)
            
            return JsonResponse({
                'meal_id': meal.id,
                'analysis': {
                    'calories': analysis['calories'],
                    'protein': analysis['protein'],
                    'carbs': analysis['carbs'],
                    'fat': analysis['fat'],
                    'fiber': analysis['fiber'],
                },
                'recommendations': analysis['recommendations'],
                'confidence_score': analysis['confidence_score'],
                'parsed_foods': parsed_foods,
                'parsed_foods': parsed_foods,
                'daily_progress': {
                    'total_calories': progress.total_calories,
                    'goal_calories': progress.goal_calories,
                    'adherence_score': progress.adherence_score,
                }
            }, status=201)
            
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)



# @action(detail=False, methods=['get'])
@csrf_exempt
def daily_summary_json(request):
    if request.method == 'GET':
        # Manual session authentication
        user = None
        sessionid = request.COOKIES.get('sessionid')
        
        if sessionid:
            from django.contrib.sessions.models import Session
            from django.contrib.auth.models import User
            try:
                session = Session.objects.get(session_key=sessionid)
                user_id = session.get_decoded().get('_auth_user_id')
                if user_id:
                    user = User.objects.get(id=user_id)
            except (Session.DoesNotExist, User.DoesNotExist):
                pass
        
        if not user:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        from django.utils import timezone
        today = timezone.now().date()
        
        meals_today = Meal.objects.filter(user=user, logged_at__date=today)
        
        total_calories = sum(meal.total_calories or 0 for meal in meals_today)
        total_protein = sum(meal.total_protein or 0 for meal in meals_today)
        total_carbs = sum(meal.total_carbs or 0 for meal in meals_today)
        total_fat = sum(meal.total_fat or 0 for meal in meals_today)
        
        return JsonResponse({
            'date': today.isoformat(),
            'meals_count': meals_today.count(),
            'totals': {
                'calories': round(total_calories, 1),
                'protein': round(total_protein, 1),
                'carbs': round(total_carbs, 1),
                'fat': round(total_fat, 1),
            }
        })
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def meals_list_json(request):
    if request.method == 'GET':
        # Manual session authentication
        user = None
        sessionid = request.COOKIES.get('sessionid')
        
        if sessionid:
            from django.contrib.sessions.models import Session
            from django.contrib.auth.models import User
            try:
                session = Session.objects.get(session_key=sessionid)
                user_id = session.get_decoded().get('_auth_user_id')
                if user_id:
                    user = User.objects.get(id=user_id)
            except (Session.DoesNotExist, User.DoesNotExist):
                pass
        
        if not user:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        meals = Meal.objects.filter(user=user).order_by('-logged_at')[:10]  # Last 10 meals
        
        meals_data = []
        for meal in meals:
            meals_data.append({
                'id': meal.id,
                'meal_type': meal.meal_type,
                'description': meal.description,
                'logged_at': meal.logged_at.isoformat(),
                'total_calories': meal.total_calories,
                'total_protein': meal.total_protein,
                'ai_confidence': meal.ai_confidence,
            })
        
        return JsonResponse({'results': meals_data})
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

class RecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Recommendation.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        recommendation = self.get_object()
        recommendation.is_read = True
        recommendation.save()
        return Response({'status': 'marked as read'})
    

@csrf_exempt
def progress_weekly_json(request):
    if request.method == 'GET':
        # Authentication
        user = None
        sessionid = request.COOKIES.get('sessionid')
        
        if sessionid:
            from django.contrib.sessions.models import Session
            from django.contrib.auth.models import User
            try:
                session = Session.objects.get(session_key=sessionid)
                user_id = session.get_decoded().get('_auth_user_id')
                if user_id:
                    user = User.objects.get(id=user_id)
            except (Session.DoesNotExist, User.DoesNotExist):
                pass
        
        if not user:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        from .services import ProgressTrackingService
        
        progress_records = ProgressTrackingService.get_weekly_progress(user)
        summary = ProgressTrackingService.get_progress_summary(user, days=7)
        
        data = {
            'progress': [
                {
                    'date': p.date.isoformat(),
                    'calories': p.total_calories,
                    'protein': p.total_protein,
                    'carbs': p.total_carbs,
                    'fat': p.total_fat,
                    'goal_calories': p.goal_calories,
                    'adherence_score': p.adherence_score,
                    'meals_count': p.meals_count,
                }
                for p in progress_records
            ],
            'summary': summary
        }
        
        return JsonResponse(data)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def progress_monthly_json(request):
    if request.method == 'GET':
        # Authentication (same as above)
        user = None
        sessionid = request.COOKIES.get('sessionid')
        
        if sessionid:
            from django.contrib.sessions.models import Session
            from django.contrib.auth.models import User
            try:
                session = Session.objects.get(session_key=sessionid)
                user_id = session.get_decoded().get('_auth_user_id')
                if user_id:
                    user = User.objects.get(id=user_id)
            except (Session.DoesNotExist, User.DoesNotExist):
                pass
        
        if not user:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        from .services import ProgressTrackingService
        
        progress_records = ProgressTrackingService.get_monthly_progress(user)
        summary = ProgressTrackingService.get_progress_summary(user, days=30)
        
        data = {
            'progress': [
                {
                    'date': p.date.isoformat(),
                    'calories': p.total_calories,
                    'protein': p.total_protein,
                    'carbs': p.total_carbs,
                    'fat': p.total_fat,
                    'goal_calories': p.goal_calories,
                    'adherence_score': p.adherence_score,
                    'meals_count': p.meals_count,
                }
                for p in progress_records
            ],
            'summary': summary
        }
        
        return JsonResponse(data)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)