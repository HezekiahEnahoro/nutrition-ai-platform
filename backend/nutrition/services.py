import requests
import os
from typing import List, Dict, Optional
from decouple import config

class USDAFoodService:
    """Service to fetch food nutrition data from USDA FoodData Central API"""
    
    BASE_URL = "https://api.nal.usda.gov/fdc/v1"
    API_KEY = config('USDA_API_KEY', default='DEMO_KEY')  # Free API key
    
    @classmethod
    def search_foods(cls, query: str, page_size: int = 5) -> List[Dict]:
        """Search for foods by name"""
        url = f"{cls.BASE_URL}/foods/search"
        params = {
            'api_key': cls.API_KEY,
            'query': query,
            'pageSize': page_size,
            'dataType': ['Survey (FNDDS)', 'Foundation', 'SR Legacy']
        }
        
        try:
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            foods = []
            for food in data.get('foods', [])[:page_size]:
                foods.append(cls._parse_food_data(food))
            
            return foods
        except Exception as e:
            print(f"USDA API error: {e}")
            return []
    
    @classmethod
    def _parse_food_data(cls, food_data: Dict) -> Dict:
        """Extract relevant nutrition data from USDA response"""
        nutrients = {}
        for nutrient in food_data.get('foodNutrients', []):
            name = nutrient.get('nutrientName', '').lower()
            value = nutrient.get('value', 0)
            
            if 'energy' in name or 'calorie' in name:
                nutrients['calories'] = value
            elif 'protein' in name:
                nutrients['protein'] = value
            elif 'carbohydrate' in name:
                nutrients['carbs'] = value
            elif 'total lipid' in name or 'fat' in name:
                nutrients['fat'] = value
            elif 'fiber' in name:
                nutrients['fiber'] = value
        
        return {
            'name': food_data.get('description', ''),
            'fdcId': food_data.get('fdcId'),
            'calories_per_100g': nutrients.get('calories', 0),
            'protein_per_100g': nutrients.get('protein', 0),
            'carbs_per_100g': nutrients.get('carbs', 0),
            'fat_per_100g': nutrients.get('fat', 0),
            'fiber_per_100g': nutrients.get('fiber', 0),
        }

    @classmethod
    def get_food_by_id(cls, fdc_id: int) -> Optional[Dict]:
        """Get detailed food data by FDC ID"""
        url = f"{cls.BASE_URL}/food/{fdc_id}"
        params = {'api_key': cls.API_KEY}
        
        try:
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            return cls._parse_food_data(response.json())
        except Exception as e:
            print(f"USDA API error: {e}")
            return None