import json
import logging
from typing import Dict, List
from decouple import config

logger = logging.getLogger(__name__)

_SYSTEM = (
    "You are a certified nutritionist. "
    "Analyze meals and return ONLY raw JSON — no markdown, no code fences, no extra text."
)

_PROMPT = """Analyze this meal. Return ONLY valid JSON, no markdown, no explanation.

Meal: {description}
Parsed foods: {parsed_foods}

Required JSON format:
{{
  "calories": <integer>,
  "protein": <integer grams>,
  "carbs": <integer grams>,
  "fat": <integer grams>,
  "fiber": <integer grams>,
  "recommendations": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "confidence_score": <float 0.0-1.0>
}}"""


class NutritionAI:
    _USE_OPENAI = config('USE_OPENAI', default=False, cast=bool)
    _OPENAI_KEY = config('OPENAI_API_KEY', default='')
    _USE_GROQ = config('USE_GROQ', default=False, cast=bool)
    _GROQ_KEY = config('GROQ_API_KEY', default='')

    def __init__(self):
        self._openai = None
        self._groq = None

        if self._USE_OPENAI and self._OPENAI_KEY:
            from openai import OpenAI
            self._openai = OpenAI(api_key=self._OPENAI_KEY)
            logger.info("NutritionAI: using OpenAI (gpt-4o-mini)")
        elif self._USE_GROQ and self._GROQ_KEY:
            from groq import Groq
            self._groq = Groq(api_key=self._GROQ_KEY)
            logger.info("NutritionAI: using Groq (llama-3.3-70b-versatile)")
        else:
            logger.warning("NutritionAI: no LLM configured, using mock analysis")

    def analyze_meal(self, description: str, parsed_foods: List[Dict] = None) -> Dict:
        if self._openai:
            return self._call_llm(self._openai, "gpt-4o-mini", description, parsed_foods)
        if self._groq:
            return self._call_llm(self._groq, "llama-3.3-70b-versatile", description, parsed_foods)
        return self._mock(description, parsed_foods)

    def _call_llm(self, client, model: str, description: str, parsed_foods: List[Dict]) -> Dict:
        prompt = _PROMPT.format(
            description=description,
            parsed_foods=json.dumps(parsed_foods or []),
        )
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": _SYSTEM},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=500,
            )
            content = response.choices[0].message.content.strip()
            # Strip markdown code fences if the model ignores the instruction
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            result = json.loads(content.strip())
            for key in ("calories", "protein", "carbs", "fat", "fiber", "recommendations", "confidence_score"):
                if key not in result:
                    raise ValueError(f"LLM response missing key: {key}")
            return result
        except Exception as exc:
            logger.error("LLM error (%s): %s — falling back to mock", model, exc)
            return self._mock(description, parsed_foods)

    def _mock(self, description: str, parsed_foods: List[Dict]) -> Dict:
        calories, protein, carbs, fat, fiber = 300, 20, 35, 10, 4
        desc = description.lower()

        if any(w in desc for w in ['chicken', 'beef', 'fish', 'turkey', 'salmon', 'tuna']):
            protein += 15; calories += 100
        if any(w in desc for w in ['rice', 'pasta', 'bread', 'potato', 'quinoa', 'oats']):
            carbs += 30; calories += 120
        if any(w in desc for w in ['salad', 'vegetables', 'broccoli', 'spinach', 'kale']):
            fiber += 3; calories += 30
        if any(w in desc for w in ['egg', 'eggs']):
            protein += 6; fat += 5; calories += 70
        if 'avocado' in desc:
            fat += 15; fiber += 5; calories += 160

        recs = []
        if protein < 25:
            recs.append("Add a protein source like chicken, fish, or legumes to support muscle repair")
        if fiber < 5:
            recs.append("Increase fiber with more vegetables, legumes, or whole grains")
        if carbs > 60:
            recs.append("High carb content — consider reducing portions if managing weight")
        if fat > 25:
            recs.append("Opt for healthy fats like avocado or nuts instead of saturated fats")
        if not recs:
            recs.append("Well-balanced meal — great macro distribution!")

        return {
            'calories': calories, 'protein': protein, 'carbs': carbs,
            'fat': fat, 'fiber': fiber, 'recommendations': recs, 'confidence_score': 0.75,
        }
