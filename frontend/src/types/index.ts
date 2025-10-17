// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: number;
  age?: number;
  weight?: number;
  height?: number;
  gender: 'male' | 'female' | 'other' | '';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
  primary_goal: 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'build_muscle' | 'improve_health';
  daily_calorie_goal?: number;
  daily_protein_goal?: number;
  daily_carbs_goal?: number;
  daily_fat_goal?: number;
  dietary_restrictions: string[];
  allergies: string[];
}

// Meal Types
export interface Meal {
  id: number;
  user: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  total_calories?: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  total_fiber?: number;
  ai_confidence?: number;
  logged_at: string;
  foods?: MealFood[];
}

export interface Food {
  id: number;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
}

export interface MealFood {
  id: number;
  food: Food;
  quantity_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// AI Analysis Types
export interface MealAnalysis {
  meal_id: number;
  analysis: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    foods: Array<{
      name: string;
      quantity: number;
      calories: number;
    }>;
  };
  recommendations: string[];
  confidence_score: number;
}

export interface Recommendation {
  id: number;
  recommendation_type: string;
  title: string;
  content: string;
  confidence_score: number;
  is_read: boolean;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}