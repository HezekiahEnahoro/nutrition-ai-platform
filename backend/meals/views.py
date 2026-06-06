import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Meal, Recommendation
from .serializers import (
    MealSerializer,
    MealCreateSerializer,
    RecommendationSerializer
)

def _infer_rec_type(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ['portion', 'reduce', 'high carb', 'over']):
        return 'portion_size'
    if any(w in t for w in ['timing', 'meal time', 'when to eat']):
        return 'meal_timing'
    if any(w in t for w in ['balanced', 'great', 'well-balanced', 'goal']):
        return 'goal_progress'
    return 'food_suggestion'

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

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Retroactively generate recommendations for meals that have none yet."""
        from nutrition.ai_service import NutritionAI
        from datetime import timedelta

        cutoff = timezone.now() - timedelta(days=30)
        meals_without_recs = Meal.objects.filter(
            user=request.user,
            logged_at__gte=cutoff,
        ).exclude(
            id__in=Recommendation.objects.filter(user=request.user).values('meal_id')
        )

        created_count = 0
        ai = NutritionAI()
        for meal in meals_without_recs:
            analysis = ai.analyze_meal(meal.description or '', [])
            for rec_text in analysis.get('recommendations', []):
                title = rec_text.split('.')[0].split(',')[0][:200]
                Recommendation.objects.create(
                    user=request.user,
                    meal=meal,
                    recommendation_type=_infer_rec_type(rec_text),
                    title=title,
                    content=rec_text,
                    confidence_score=analysis.get('confidence_score', 0.75),
                )
                created_count += 1

        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response({'created': created_count, 'results': serializer.data})


@csrf_exempt
def analyze_meal_json(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    try:
        data = json.loads(request.body)
        meal_description = data.get('description', '').strip()
        meal_type = data.get('meal_type', 'snack')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    if not meal_description:
        return JsonResponse({'error': 'Meal description required'}, status=400)

    try:
        from nutrition.meal_parser import MealParser
        from nutrition.ai_service import NutritionAI

        parsed_foods = MealParser.parse_meal(meal_description)
        logger.debug("Parsed foods: %s", parsed_foods)

        ai = NutritionAI()
        analysis = ai.analyze_meal(meal_description, parsed_foods)

        meal = Meal.objects.create(
            user=request.user,
            description=meal_description,
            meal_type=meal_type,
            total_calories=analysis['calories'],
            total_protein=analysis['protein'],
            total_carbs=analysis['carbs'],
            total_fat=analysis['fat'],
            total_fiber=analysis['fiber'],
            ai_confidence=analysis['confidence_score']
        )

        for rec_text in analysis.get('recommendations', []):
            title = rec_text.split('.')[0].split(',')[0][:200]
            Recommendation.objects.create(
                user=request.user,
                meal=meal,
                recommendation_type=_infer_rec_type(rec_text),
                title=title,
                content=rec_text,
                confidence_score=analysis.get('confidence_score', 0.75),
            )

        try:
            request.user.profile.update_streak()
        except Exception as e:
            logger.warning("Streak update failed: %s", e)

        from .services import ProgressTrackingService
        today = timezone.now().date()
        progress = ProgressTrackingService.update_daily_progress(request.user, today)

        profile = request.user.profile
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
            'daily_progress': {
                'total_calories': progress.total_calories,
                'goal_calories': progress.goal_calories,
                'adherence_score': progress.adherence_score,
            },
            'streak': {
                'current': profile.current_streak,
                'longest': profile.longest_streak,
            },
        }, status=201)

    except Exception as e:
        logger.error("Meal analysis error: %s", str(e))
        return JsonResponse({'error': 'Failed to analyze meal'}, status=500)


@csrf_exempt
def daily_summary_json(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    today = timezone.now().date()
    meals_today = Meal.objects.filter(user=request.user, logged_at__date=today)
    profile = request.user.profile

    return JsonResponse({
        'date': today.isoformat(),
        'meals_count': meals_today.count(),
        'totals': {
            'calories': round(sum(m.total_calories or 0 for m in meals_today), 1),
            'protein': round(sum(m.total_protein or 0 for m in meals_today), 1),
            'carbs': round(sum(m.total_carbs or 0 for m in meals_today), 1),
            'fat': round(sum(m.total_fat or 0 for m in meals_today), 1),
        },
        'streak': {
            'current': profile.current_streak,
            'longest': profile.longest_streak,
        },
    })


@csrf_exempt
def progress_weekly_json(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    from .services import ProgressTrackingService
    progress_records = ProgressTrackingService.get_weekly_progress(request.user)
    summary = ProgressTrackingService.get_progress_summary(request.user, days=7)

    return JsonResponse({
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
    })


@csrf_exempt
def barcode_lookup(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    barcode = request.GET.get('barcode', '').strip()
    if not barcode:
        return JsonResponse({'error': 'barcode parameter required'}, status=400)
    import re
    if not re.match(r'^[A-Za-z0-9]{1,50}$', barcode):
        return JsonResponse({'error': 'Invalid barcode'}, status=400)

    try:
        import requests as http_requests
        res = http_requests.get(
            f'https://world.openfoodfacts.org/api/v0/product/{barcode}.json',
            timeout=6,
            headers={'User-Agent': 'NutritionOS/1.0 (contact@nutritionos.app)'},
        )
        data = res.json()
        if data.get('status') != 1:
            return JsonResponse({'error': 'Product not found'}, status=404)

        p = data.get('product', {})
        n = p.get('nutriments', {})

        def _n(key, fallback=0):
            return round(float(n.get(key) or fallback), 1)

        return JsonResponse({
            'name': p.get('product_name') or p.get('product_name_en') or 'Unknown Product',
            'brand': p.get('brands', ''),
            'serving_size': p.get('serving_size', '100g'),
            'image_url': p.get('image_front_small_url', ''),
            'per_100g': {
                'calories': _n('energy-kcal_100g'),
                'protein': _n('proteins_100g'),
                'carbs': _n('carbohydrates_100g'),
                'fat': _n('fat_100g'),
                'fiber': _n('fiber_100g'),
            },
        })
    except Exception as exc:
        logger.error("Barcode lookup error: %s", exc)
        return JsonResponse({'error': 'Lookup failed'}, status=500)


@csrf_exempt
def progress_monthly_json(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    from .services import ProgressTrackingService
    progress_records = ProgressTrackingService.get_monthly_progress(request.user)
    summary = ProgressTrackingService.get_progress_summary(request.user, days=30)

    return JsonResponse({
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
    })
