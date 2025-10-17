from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class NutritionAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # For now, just return mock data
        # In Day 3 we'll add real OpenAI integration
        
        description = request.data.get('description', '')
        meal_type = request.data.get('meal_type', 'snack')
        
        if not description:
            return Response(
                {'error': 'Meal description is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mock analysis based on description length/content
        mock_analysis = {
            'calories': 350,
            'protein': 25,
            'carbs': 45,
            'fat': 12,
            'fiber': 5,
        }
        
        mock_recommendations = [
            "Good protein content for muscle building!",
            "Consider adding more vegetables for fiber."
        ]
        
        return Response({
            'analysis': mock_analysis,
            'recommendations': mock_recommendations,
            'confidence_score': 0.85
        })