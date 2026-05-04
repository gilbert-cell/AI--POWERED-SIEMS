"""
Django settings for siem_project project.
"""

import os
from pathlib import Path
from urllib.parse import urlsplit
from dotenv import load_dotenv

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env
load_dotenv(BASE_DIR / '.env')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fallback-key-change-me')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
RENDER_EXTERNAL_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'siem_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'siem_project.wsgi.application'

# Database Configuration
SUPPORTED_DATABASE_SCHEMES = {
    'cockroach', 'mssql', 'mssqlms', 'mysql', 'mysql-connector',
    'mysql2', 'mysqlgis', 'oracle', 'oraclegis', 'pgsql', 'postgis',
    'postgres', 'postgresql', 'redshift', 'spatialite', 'sqlite',
    'timescale', 'timescalegis',
}


def normalize_database_url(value):
    url = (value or '').strip().strip('"').strip("'")
    if not url:
        return ''
    if url.startswith('//'):
        return f'postgres:{url}'
    if '://' not in url and '@' in url and '/' in url:
        return f'postgres://{url}'
    return url


def describe_database_url(value):
    url = (value or '').strip().strip('"').strip("'")
    if not url:
        return 'empty'
    scheme = urlsplit(url).scheme.lower()
    if scheme:
        return f'uses unsupported scheme "{scheme}"'
    return 'has no URL scheme'


def get_database_url():
    for env_name in ('DATABASE_URL', 'POSTGRES_URL', 'POSTGRESQL_URL', 'RENDER_DATABASE_URL'):
        database_url = normalize_database_url(os.getenv(env_name))
        if database_url:
            return database_url, env_name
    return '', 'DATABASE_URL'


DATABASE_URL, DATABASE_URL_ENV = get_database_url()
if DATABASE_URL:
    database_scheme = urlsplit(DATABASE_URL).scheme.lower()
    if database_scheme not in SUPPORTED_DATABASE_SCHEMES:
        raise RuntimeError(
            f'{DATABASE_URL_ENV} {describe_database_url(DATABASE_URL)}. '
            'Set it to the full Render Postgres Internal Database URL, '
            'which starts with postgres:// or postgresql://.'
        )

    import dj_database_url

    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=not DEBUG,
        )
    }
elif RENDER_EXTERNAL_HOSTNAME:
    raise RuntimeError(
        'DATABASE_URL must be set to the full Render Postgres Internal Database URL '
        'in production. It should start with postgres:// or postgresql://.'
    )
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'siem_db'),
            'USER': os.getenv('DB_USER', 'grace'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
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

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Security settings (production only)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
if os.getenv('FRONTEND_URL'):
    CORS_ALLOWED_ORIGINS.append(os.getenv('FRONTEND_URL'))
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
CORS_ALLOW_HEADERS = ['accept', 'authorization', 'content-type', 'origin', 'x-requested-with']
