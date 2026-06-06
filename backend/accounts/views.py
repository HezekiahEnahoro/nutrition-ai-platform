import logging
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import login, logout

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserWithProfileSerializer,
    UserProfileSerializer
)

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logger.info("Registration attempt for: %s", request.data.get('username'))
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                if not request.session.session_key:
                    request.session.create()
                login(request, user)
                request.session.save()
                logger.info("User %s registered and logged in", user.username)
                return Response({
                    'message': 'User created successfully',
                    'user': UserWithProfileSerializer(user).data,
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error("Error creating user: %s", str(e))
                return Response({'error': f'Failed to create user: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        logger.warning("Registration validation errors: %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logger.info("Login attempt for: %s", request.data.get('username'))
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            logger.info("User %s logged in successfully", user.username)
            return Response({
                'message': 'Login successful',
                'user': UserWithProfileSerializer(user).data,
            }, status=200)

        logger.warning("Login validation errors: %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logout(request)
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class CurrentUserView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = UserWithProfileSerializer(request.user)
        return Response({'user': serializer.data})


@method_decorator(csrf_exempt, name='dispatch')
class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user.profile)
        return Response(serializer.data)

    def patch(self, request):
        profile = request.user.profile
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            profile.refresh_from_db()
            if all([profile.age, profile.weight, profile.height, profile.gender]):
                profile.is_profile_complete = True
                profile.update_goals()
                profile.save()
                # Backfill DailyProgress records that were created before goals were set
                if profile.daily_calorie_goal:
                    from meals.models import DailyProgress
                    for dp in DailyProgress.objects.filter(user=request.user, goal_calories__isnull=True):
                        dp.goal_calories = profile.daily_calorie_goal
                        dp.goal_protein = profile.daily_protein_goal
                        dp.goal_carbs = profile.daily_carbs_goal
                        dp.goal_fat = profile.daily_fat_goal
                        dp.calculate_adherence()
                        dp.save()
            return Response(UserProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class SessionCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'user_authenticated': request.user.is_authenticated,
            'user_id': request.user.id if request.user.is_authenticated else None,
            'user_username': request.user.username if request.user.is_authenticated else None,
            'session_key': request.session.session_key,
            'cookies_received': list(request.COOKIES.keys()),
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def protected_test_view(request):
    return Response({
        'message': f'Hello {request.user.username}!',
        'user_id': request.user.id,
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def csrf_seed(request):
    return Response({"detail": "ok"})
