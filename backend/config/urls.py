from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def root_view(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'Nutrition AI Backend is running',
        'version': '1.0'
    })

urlpatterns = [
    path('', root_view),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/meals/', include('meals.urls')),
    path('api/nutrition/', include('nutrition.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)