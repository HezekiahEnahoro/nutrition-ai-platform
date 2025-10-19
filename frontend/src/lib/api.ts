import { User, Meal, MealAnalysis, UserProfile, Recommendation } from '@/types';

const API_BASE_URL = 'https://nutrition-ai-platform.onrender.com/api';

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

    const config: RequestInit = {
      mode: 'cors',
      credentials: 'include', // Important for session cookies
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
        return { 
          error: data.detail || data.message || data.error || `HTTP ${response.status}` 
        };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Network error occurred' };
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
    return this.request(`/meals/daily_summary/${dateParam}`);
  }

  // Profile methods
  async updateProfile(profileData: Partial<UserProfile>) {
    return this.request<UserProfile>('/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  async getRecommendations() {
    return this.request<{ results: Recommendation[] }>('/meals/recommendations/');
  }
}

export const api = new ApiClient(API_BASE_URL);