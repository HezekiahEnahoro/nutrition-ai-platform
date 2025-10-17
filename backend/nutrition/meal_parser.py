import re
from typing import List, Dict, Tuple, Optional


class MealParser:
    """Parse meal descriptions into individual food items with quantities"""
    
    # Common portion size patterns
    PORTION_PATTERNS = {
        r'(\d+(?:\.\d+)?)\s*(?:cups?|c)': ('cup', 1),
        r'(\d+(?:\.\d+)?)\s*(?:tablespoons?|tbsp)': ('tablespoon', 1),
        r'(\d+(?:\.\d+)?)\s*(?:teaspoons?|tsp)': ('teaspoon', 1),
        r'(\d+(?:\.\d+)?)\s*(?:ounces?|oz)': ('ounce', 28.35),  # grams
        r'(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)': ('pound', 453.59),
        r'(\d+(?:\.\d+)?)\s*(?:grams?|g)': ('gram', 1),
        r'(\d+(?:\.\d+)?)\s*(?:pieces?|pcs?)': ('piece', 100),  # estimate
        r'(\d+(?:\.\d+)?)\s*(?:slices?)': ('slice', 30),  # estimate
        r'(\d+(?:\.\d+)?)\s*(?:servings?)': ('serving', 150),  # estimate
    }
    
    # Common separators
    SEPARATORS = [',', ' and ', ' with ', '\n', ';']
    
    @classmethod
    def parse_meal(cls, description: str) -> List[Dict]:
        """
        Parse meal description into food items with quantities
        Returns: [{'food': 'chicken breast', 'quantity_grams': 200}, ...]
        """
        items = []
        
        # Split by common separators
        parts = [description]
        for sep in cls.SEPARATORS:
            new_parts = []
            for part in parts:
                new_parts.extend(part.split(sep))
            parts = new_parts
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
            
            food_item = cls._parse_food_item(part)
            if food_item:
                items.append(food_item)
        
        return items
    
    @classmethod
    def _parse_food_item(cls, text: str) -> Optional[Dict]:
        """Parse a single food item with quantity"""
        text = text.lower().strip()
        
        # Try to extract quantity
        quantity_grams = 100  # default
        food_name = text
        
        for pattern, (unit, grams_per_unit) in cls.PORTION_PATTERNS.items():
            match = re.search(pattern, text)
            if match:
                amount = float(match.group(1))
                quantity_grams = amount * grams_per_unit
                # Remove the quantity from the food name
                food_name = re.sub(pattern, '', text).strip()
                break
        
        # Clean up the food name
        food_name = cls._clean_food_name(food_name)
        
        if not food_name:
            return None
        
        return {
            'food': food_name,
            'quantity_grams': round(quantity_grams, 1)
        }
    
    @classmethod
    def _clean_food_name(cls, name: str) -> str:
        """Clean and standardize food names"""
        # Remove common words
        remove_words = ['a', 'an', 'the', 'some', 'of']
        words = name.split()
        words = [w for w in words if w not in remove_words]
        
        # Join and clean
        clean_name = ' '.join(words).strip()
        
        return clean_name