# Nutrition AI - Backend

Django REST API for AI-powered nutrition tracking.

## Setup
```bash
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Key Components

- **accounts/** - User authentication and profiles
- **meals/** - Meal logging and tracking
- **nutrition/** - AI analysis and USDA integration

## API Documentation

See root README for endpoint details.