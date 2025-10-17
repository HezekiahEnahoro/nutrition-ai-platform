from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('user/', views.CurrentUserView.current_user_json, name='current_user'),
    path('profile/', views.update_profile_json, name='profile'),
    path('test/', views.protected_test_view, name='test'),
    path('session-check/', views.SessionCheckView.as_view(), name='session_check'),
    path('simple-test/', views.simple_test, name='simple_test'),
    path('simple-user/', views.simple_user_test, name='simple_user'), 
]