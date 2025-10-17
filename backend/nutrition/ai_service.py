import openai
from decouple import config
from typing import Dict, List
import json

class NutritionAI:
    """AI-powered nutrition analysis with togglable real/mock data"""
    
    USE_REAL_AI = config('USE_OPENAI', default=False, cast=bool)
    OPENAI_API_KEY = config('OPENAI_API_KEY', default='')
    
    def __init__(self):
        if self.USE_REAL_AI and self.OPENAI_API_KEY:
            openai.api_key = self.OPENAI_API_KEY
    
    def analyze_meal(self, description: str, parsed_foods: List[Dict] = None) -> Dict:
        """Analyze meal and return nutrition data"""
        if self.USE_REAL_AI:
            return self._analyze_with_openai(description, parsed_foods)
        else:
            return self._analyze_mock(description, parsed_foods)
    
    def _analyze_with_openai(self, description: str, parsed_foods: List[Dict]) -> Dict:
        """Real OpenAI analysis"""
        prompt = f"""Analyze this meal and provide detailed nutrition information:

Meal description: {description}
Parsed foods: {json.dumps(parsed_foods)}

Provide a JSON response with:
1. Estimated total calories
2. Macronutrients (protein, carbs, fat in grams)
3. Fiber content
4. 2-3 specific recommendations for improvement
5. Confidence score (0-1)

Format as valid JSON."""

        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a certified nutritionist providing meal analysis."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return self._analyze_mock(description, parsed_foods)
    
    def _analyze_mock(self, description: str, parsed_foods: List[Dict]) -> Dict:
        """Mock analysis based on parsed foods and keywords"""
        # Estimate based on keywords
        calories = 300
        protein = 20
        carbs = 35
        fat = 10
        fiber = 4
        
        desc_lower = description.lower()
        
        # Adjust based on keywords
        if any(word in desc_lower for word in ['chicken', 'beef', 'fish', 'turkey']):
            protein += 15
            calories += 100
        
        if any(word in desc_lower for word in ['rice', 'pasta', 'bread', 'potato']):
            carbs += 30
            calories += 120
        
        if any(word in desc_lower for word in ['salad', 'vegetables', 'broccoli', 'spinach']):
            fiber += 3
            calories += 30
        
        # Generate recommendations
        recommendations = []
        if protein < 25:
            recommendations.append("Consider adding more protein for muscle maintenance")
        if fiber < 5:
            recommendations.append("Add more vegetables or whole grains for fiber")
        if carbs > 60:
            recommendations.append("High carb content - consider reducing portion sizes if weight loss is a goal")
        
        if not recommendations:
            recommendations.append("Well-balanced meal with good macro distribution")
        
        return {
            'calories': calories,
            'protein': protein,
            'carbs': carbs,
            'fat': fat,
            'fiber': fiber,
            'recommendations': recommendations,
            'confidence_score': 0.75
        }