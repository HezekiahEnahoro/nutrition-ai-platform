import { User, Meal, MealAnalysis, UserProfile, Recommendation } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://nutrition-ai-platform.onrender.com/api';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

interface RegisterData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${this.baseURL}${endpoint}`;
  const method = options.method || 'GET';
  const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());

  const config: RequestInit = {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(isMutating ? { 'X-CSRFToken': getCsrfToken() } : {}),
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);
    
    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      // Extract error message from various response formats
      let errorMessage = 'An error occurred';
      
      if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
        errorMessage = data.non_field_errors[0];
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.detail) {
        errorMessage = data.detail;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.username) {
        errorMessage = Array.isArray(data.username) ? data.username[0] : data.username;
      } else if (data.email) {
        errorMessage = Array.isArray(data.email) ? data.email[0] : data.email;
      } else if (data.password) {
        errorMessage = Array.isArray(data.password) ? data.password[0] : data.password;
      } else {
        // Try to get any field error
        const firstErrorKey = Object.keys(data).find(key => data[key]);
        if (firstErrorKey && data[firstErrorKey]) {
          const errorValue = data[firstErrorKey];
          errorMessage = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        }
      }
      
      return { error: errorMessage };
    }

    return { data };
  } catch (error) {
    console.error('API request failed:', error);
    return { error: 'Network error. Please check your connection.' };
  }
}

  // Auth methods
  async login(username: string, password: string) {
    return this.request<{ user: User; message: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(userData: RegisterData) {
    return this.request<{ user: User; message: string }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout/', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/user/');
  }

  // Meal methods
  async getMeals() {
    return this.request<{ results: Meal[] }>('/meals/');
  }

  async createMeal(mealData: { meal_type: string; description: string }) {
    return this.request<Meal>('/meals/', {
      method: 'POST',
      body: JSON.stringify(mealData),
    });
  }

  async analyzeMeal(description: string, mealType: string) {
    return this.request<MealAnalysis>('/meals/analyze/', {
      method: 'POST',
      body: JSON.stringify({
        description,
        meal_type: mealType,
      }),
    });
  }

  async getDailySummary(date?: string) {
    const dateParam = date ? `?date=${date}` : '';
    return this.request<{ date: string; meals_count: number; totals: { calories: number; protein: number; carbs: number; fat: number } }>(`/meals/daily_summary/${dateParam}`);
  }

  async deleteMeal(id: number) {
    return this.request(`/meals/${id}/`, { method: 'DELETE' });
  }

  async getWeeklyProgress() {
    return this.request<{ progress: unknown[]; summary: unknown }>('/meals/progress/weekly/');
  }

  async getMonthlyProgress() {
    return this.request<{ progress: unknown[]; summary: unknown }>('/meals/progress/monthly/');
  }

  // Profile methods
  async getProfile() {
    return this.request<UserProfile>('/auth/profile/');
  }

  async updateProfile(profileData: Partial<UserProfile>) {
    return this.request<UserProfile>('/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  async lookupBarcode(barcode: string) {
    return this.request<{
      name: string;
      brand: string;
      serving_size: string;
      image_url: string;
      per_100g: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
    }>(`/meals/barcode/?barcode=${encodeURIComponent(barcode)}`);
  }

  // Recommendations
  async getRecommendations() {
    return this.request<{ results: Recommendation[] }>('/meals/recommendations/');
  }

  async generateRecommendations() {
    return this.request<{ created: number; results: Recommendation[] }>('/meals/recommendations/generate/', { method: 'POST' });
  }

  async markRecommendationRead(id: number) {
    return this.request(`/meals/recommendations/${id}/mark_read/`, { method: 'PATCH' });
  }
}

export const api = new ApiClient(API_BASE_URL);