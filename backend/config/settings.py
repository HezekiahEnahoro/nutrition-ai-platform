import os
from decouple import config
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# FORCE SQLite for local development
# FORCE_SQLITE = True
# Security
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me')
DEBUG = config('DEBUG', default=False, cast=bool)  # Changed to False for production
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'corsheaders',
]

LOCAL_APPS = [
    'accounts',
    'meals',
    'nutrition',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this for static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'  # ADD THIS LINE

# Database - Production PostgreSQL or Development SQLite
DATABASE_URL = config('DATABASE_URL', default=None)

import os
from decouple import config
import re

# Database
DATABASE_URL = config('DATABASE_URL', default=None)

if DATABASE_URL:
    # Production - PostgreSQL
    match = re.match(r'postgres(?:ql)?://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(.+)', DATABASE_URL)
    
    if match:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': match.group(5).split('?')[0],
                'USER': match.group(1),
                'PASSWORD': match.group(2),
                'HOST': match.group(3),
                'PORT': match.group(4) or '5432',
            }
        }
    else:
        # Fallback
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
else:
    # Development - SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# -----------------------------
# CORS / CSRF / Cookies (env-driven)
# -----------------------------
from urllib.parse import urlparse

def _split(name: str, default: str = ""):
    raw = config(name, default=default)
    return [x.strip() for x in raw.split(",") if x.strip()]

def _ensure_scheme(origins, default_scheme="http"):
    norm = []
    for o in origins:
        if o.startswith("http://") or o.startswith("https://"):
            norm.append(o)
        else:
            # add scheme if missing
            norm.append(f"{default_scheme}://{o}")
    return norm

# Local dev defaults
_default_cors = "http://localhost:3000,http://127.0.0.1:3000"
_default_csrf = "http://localhost:3000,http://127.0.0.1:3000"

# Read env and normalize
_raw_cors = _split("CORS_ALLOWED_ORIGINS", _default_cors)
_raw_csrf = _split("CSRF_TRUSTED_ORIGINS", _default_csrf)

# If any entries are missing http(s), add it (http for dev, https for prod)
CORS_ALLOWED_ORIGINS = _ensure_scheme(_raw_cors, default_scheme="https" if not DEBUG else "http")
CSRF_TRUSTED_ORIGINS = _ensure_scheme(_raw_csrf, default_scheme="https" if not DEBUG else "http")

# Optional: allow Vercel preview subdomains for CORS (not for CSRF)
# Example: CORS_ALLOWED_ORIGIN_REGEXES="^https://.*\\.vercel\\.app$"
CORS_ALLOWED_ORIGIN_REGEXES = _split("CORS_ALLOWED_ORIGIN_REGEXES", "")

CORS_ALLOW_CREDENTIALS = True
# (You can rely on django-cors-headers defaults for methods/headers)

# Cookie policy
# If FRONTEND and API are different HTTPS origins (Vercel ↔ Render), use cross-site settings.
CROSS_SITE_PROD = config("CROSS_SITE_PROD", default="true", cast=bool)

if DEBUG:
    # Dev over HTTP
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SESSION_COOKIE_SAMESITE = "Lax"
    CSRF_COOKIE_SAMESITE = "Lax"
else:
    if CROSS_SITE_PROD:
        # Cross-site HTTPS
        SESSION_COOKIE_SECURE = True
        CSRF_COOKIE_SECURE = True
        SESSION_COOKIE_SAMESITE = "None"
        CSRF_COOKIE_SAMESITE = "None"
    else:
        # Same-origin HTTPS (behind a proxy/domain that serves both)
        SESSION_COOKIE_SECURE = True
        CSRF_COOKIE_SECURE = True
        SESSION_COOKIE_SAMESITE = "Lax"
        CSRF_COOKIE_SAMESITE = "Lax"

# Keep CSRF cookie readable so you can send X-CSRFToken
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_HTTPONLY = False  # if you don’t need JS access, set True for security

SESSION_COOKIE_NAME = config("SESSION_COOKIE_NAME", default="sessionid")
CSRF_COOKIE_NAME   = config("CSRF_COOKIE_NAME", default="csrftoken")
SESSION_COOKIE_DOMAIN = config("SESSION_COOKIE_DOMAIN", default=None)
CSRF_COOKIE_DOMAIN    = config("CSRF_COOKIE_DOMAIN", default=None)

# Don’t let redirects break preflight during setup; enable later if desired
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=not DEBUG, cast=bool)


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files - Production ready
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Remove STATICFILES_DIRS if static folder doesn't exist
# STATICFILES_DIRS = [BASE_DIR / 'static']  # Comment this out

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# OpenAI Configuration
OPENAI_API_KEY = config('OPENAI_API_KEY', default='')
USE_OPENAI = config('USE_OPENAI', default=False, cast=bool)

# USDA API
USDA_API_KEY = config('USDA_API_KEY', default='DEMO_KEY')


# Security settings (production only)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'