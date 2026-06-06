import logging
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from .meal_parser import MealParser
from .ai_service import NutritionAI

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class NutritionAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        description = request.data.get('description', '').strip()
        meal_type = request.data.get('meal_type', 'snack')

        if not description:
            return Response({'error': 'Meal description is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parsed_foods = MealParser.parse_meal(description)
            analysis = NutritionAI().analyze_meal(description, parsed_foods)

            return Response({
                'analysis': {
                    'calories': analysis['calories'],
                    'protein': analysis['protein'],
                    'carbs': analysis['carbs'],
                    'fat': analysis['fat'],
                    'fiber': analysis['fiber'],
                },
                'recommendations': analysis['recommendations'],
                'confidence_score': analysis['confidence_score'],
            })
        except Exception as e:
            logger.error("Nutrition analysis error: %s", str(e))
            return Response({'error': 'Failed to analyze nutrition'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
