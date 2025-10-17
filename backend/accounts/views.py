from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.contrib.auth import get_user
from django.contrib.auth.decorators import login_required
import logging
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .serializers import (
    RegisterSerializer, 
    LoginSerializer, 
    UserWithProfileSerializer,
    UserProfileSerializer
)
from .models import UserProfile

# Add logger
logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        print(f"Registration attempt with data: {request.data}")  # Use print for now
        
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                
                # Force session creation
                if not request.session.session_key:
                    request.session.create()
                
                # Login the user
                login(request, user)
                
                # Force session save
                request.session.save()
                
                print(f"User {user.username} registered and logged in")
                print(f"Session key: {request.session.session_key}")
                
                user_serializer = UserWithProfileSerializer(user)
                return Response({
                    'message': 'User created successfully',
                    'user': user_serializer.data,
                    'session_key': request.session.session_key
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                print(f"Error creating user: {str(e)}")
                return Response({
                    'error': f'Failed to create user: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Registration validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        print(f"Login attempt for: {request.data.get('username')}")
        
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Force session creation
            if not request.session.session_key:
                request.session.create()
            
            login(request, user)
            request.session.save()
            
            session_key = request.session.session_key
            print(f"User {user.username} logged in successfully")
            print(f"Session key: {session_key}")
            
            user_serializer = UserWithProfileSerializer(user)
            
            response_data = {
                'message': 'Login successful',
                'user': user_serializer.data,
                'session_key': session_key
            }
            
            response = JsonResponse(response_data, status=200)
            
            # Set cookie with domain that works for cross-origin
            response.set_cookie(
                'sessionid',
                session_key,
                max_age=1209600,
                httponly=False,
                secure=False,
                samesite=None,
                # domain='.localhost'  # This is key - allows sharing between subdomains
            )
            
            print(f"Setting cookie with domain=.localhost: sessionid={session_key}")
            return response
        
        print(f"Login validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)

class CurrentUserView(APIView):
    permission_classes = [permissions.AllowAny]  
    def get(self, request):
            print(f"Current user check: {request.user.is_authenticated} - {request.user}")
            
            if not request.user.is_authenticated:
                return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
                
            serializer = UserWithProfileSerializer(request.user)
            return Response({'user': serializer.data})
    
    @csrf_exempt  
    def current_user_json(request):
        if request.method == 'GET':
            print("current_user_json function called")  # Debug print
            
            user = None
            sessionid = request.COOKIES.get('sessionid')
            print(f"current_user_json - sessionid: {sessionid}")
            
            if sessionid:
                from django.contrib.sessions.models import Session
                from django.contrib.auth.models import User
                try:
                    session = Session.objects.get(session_key=sessionid)
                    user_id = session.get_decoded().get('_auth_user_id')
                    if user_id:
                        user = User.objects.get(id=user_id)
                        print(f"Found user: {user.username}")
                except (Session.DoesNotExist, User.DoesNotExist) as e:
                    print(f"Session lookup failed: {e}")
            
            if user:
                return JsonResponse({'user': {'id': user.id, 'username': user.username}})  # Simple response for now
            else:
                return JsonResponse({'error': 'Not authenticated'}, status=401)
        return JsonResponse({'error': 'Method not allowed'}, status=405)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile = request.user.profile
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Session check for debugging
@method_decorator(csrf_exempt, name='dispatch')
class SessionCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'user_authenticated': request.user.is_authenticated,
            'user_id': request.user.id if request.user.is_authenticated else None,
            'user_username': request.user.username if request.user.is_authenticated else None,
            'session_key': request.session.session_key,
            'session_data': dict(request.session) if request.session.session_key else {},
            'cookies_received': list(request.COOKIES.keys()),
            'headers': {
                'user-agent': request.META.get('HTTP_USER_AGENT', ''),
                'origin': request.META.get('HTTP_ORIGIN', ''),
                'referer': request.META.get('HTTP_REFERER', ''),
            }
        })

# Simple API view for testing
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def protected_test_view(request):
    return Response({
        'message': f'Hello {request.user.username}!',
        'user_id': request.user.id,
        'is_authenticated': request.user.is_authenticated
    })

api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def csrf_seed(request):
    return Response({"detail": "ok"})

@csrf_exempt
def update_profile_json(request):
    if request.method in ['PATCH', 'POST']:
        # Authentication
        user = None
        sessionid = request.COOKIES.get('sessionid')
        
        if sessionid:
            from django.contrib.sessions.models import Session
            from django.contrib.auth.models import User
            try:
                session = Session.objects.get(session_key=sessionid)
                user_id = session.get_decoded().get('_auth_user_id')
                if user_id:
                    user = User.objects.get(id=user_id)
            except (Session.DoesNotExist, User.DoesNotExist):
                pass
        
        if not user:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        import json
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        profile = user.profile
        
        # Update fields
        if 'age' in data:
            profile.age = data['age']
        if 'weight' in data:
            profile.weight = data['weight']
        if 'height' in data:
            profile.height = data['height']
        if 'gender' in data:
            profile.gender = data['gender']
        if 'activity_level' in data:
            profile.activity_level = data['activity_level']
        if 'primary_goal' in data:
            profile.primary_goal = data['primary_goal']
        if 'dietary_restrictions' in data:
            profile.dietary_restrictions = data['dietary_restrictions']
        if 'allergies' in data:
            profile.allergies = data['allergies']
        
        # Check if profile is complete
        if all([profile.age, profile.weight, profile.height, profile.gender]):
            profile.is_profile_complete = True
            profile.update_goals()  # Auto-calculate nutrition goals
        
        profile.save()
        
        return JsonResponse({
            'message': 'Profile updated successfully',
            'profile': {
                'age': profile.age,
                'weight': profile.weight,
                'height': profile.height,
                'gender': profile.gender,
                'activity_level': profile.activity_level,
                'primary_goal': profile.primary_goal,
                'daily_calorie_goal': profile.daily_calorie_goal,
                'daily_protein_goal': profile.daily_protein_goal,
                'daily_carbs_goal': profile.daily_carbs_goal,
                'daily_fat_goal': profile.daily_fat_goal,
                'is_profile_complete': profile.is_profile_complete,
            }
        })
    
    elif request.method == 'GET':
        # Get profile
        user = None
        sessionid = request.COOKIES.get('sessionid')
        
        if sessionid:
            from django.contrib.sessions.models import Session
            from django.contrib.auth.models import User
            try:
                session = Session.objects.get(session_key=sessionid)
                user_id = session.get_decoded().get('_auth_user_id')
                if user_id:
                    user = User.objects.get(id=user_id)
            except (Session.DoesNotExist, User.DoesNotExist):
                pass
        
        if not user:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        profile = user.profile
        return JsonResponse({
            'age': profile.age,
            'weight': profile.weight,
            'height': profile.height,
            'gender': profile.gender,
            'activity_level': profile.activity_level,
            'primary_goal': profile.primary_goal,
            'dietary_restrictions': profile.dietary_restrictions,
            'allergies': profile.allergies,
            'daily_calorie_goal': profile.daily_calorie_goal,
            'daily_protein_goal': profile.daily_protein_goal,
            'daily_carbs_goal': profile.daily_carbs_goal,
            'daily_fat_goal': profile.daily_fat_goal,
            'is_profile_complete': profile.is_profile_complete,
            'bmr': profile.calculate_bmr(),
            'recommended_calories': profile.calculate_daily_calories(),
        })
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def simple_test(request):
    return HttpResponse("Test endpoint works!")

@csrf_exempt
def simple_user_test(request):
    if request.method == 'GET':
        print(f"Cookies received: {dict(request.COOKIES)}")
        print(f"Session key from request: {request.session.session_key}")
        print(f"User authenticated: {request.user.is_authenticated}")
        
        # Try to get user from session manually
        sessionid = request.COOKIES.get('sessionid')
        manual_user = None
        if sessionid:
            from django.contrib.sessions.models import Session
            from django.contrib.auth.models import User
            try:
                session = Session.objects.get(session_key=sessionid)
                user_id = session.get_decoded().get('_auth_user_id')
                if user_id:
                    manual_user = User.objects.get(id=user_id)
                    print(f"Manual session lookup found user: {manual_user.username}")
            except (Session.DoesNotExist, User.DoesNotExist) as e:
                print(f"Manual session lookup failed: {e}")
        
        return JsonResponse({
            'user_authenticated': request.user.is_authenticated,
            'user_id': request.user.id if request.user.is_authenticated else None,
            'cookies_count': len(request.COOKIES),
            'has_sessionid': 'sessionid' in request.COOKIES,
            'manual_user': manual_user.username if manual_user else None,
            'session_key': request.session.session_key
        })
    return JsonResponse({'error': 'Method not allowed'})