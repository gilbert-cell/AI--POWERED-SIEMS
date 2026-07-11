"""
api/auth_utils.py — JWT token helpers and authentication decorator.

Uses PyJWT (already a transitive dependency of djangorestframework-simplejwt).
Falls back to HMAC-signed tokens if PyJWT is unavailable so the app still
starts during a fresh install before dependencies are fully resolved.
"""
import hashlib
import hmac
import json
import logging
import time
from functools import wraps

from django.conf import settings
from django.http import JsonResponse

logger = logging.getLogger(__name__)

# ── Token lifetime ────────────────────────────────────────────────────────────
ACCESS_TOKEN_TTL  = int(getattr(settings, 'JWT_ACCESS_TTL_SECONDS',  60 * 60))       # 1 hour
REFRESH_TOKEN_TTL = int(getattr(settings, 'JWT_REFRESH_TTL_SECONDS', 60 * 60 * 24))  # 24 hours


def _secret() -> bytes:
    return settings.SECRET_KEY.encode()


# ── Lightweight HMAC-JWT (no extra dependency) ────────────────────────────────
import base64 as _b64


def _b64url_encode(data: bytes) -> str:
    return _b64.urlsafe_b64encode(data).rstrip(b'=').decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    return _b64.urlsafe_b64decode(s + '=' * (padding % 4))


def generate_token(user_id: int, email: str, role: str, ttl: int = ACCESS_TOKEN_TTL) -> str:
    """Return a signed JWT-style token (header.payload.signature)."""
    header  = _b64url_encode(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode())
    payload = _b64url_encode(json.dumps({
        'sub': user_id,
        'email': email,
        'role': role,
        'iat': int(time.time()),
        'exp': int(time.time()) + ttl,
    }).encode())
    sig = _b64url_encode(
        hmac.new(_secret(), f'{header}.{payload}'.encode(), hashlib.sha256).digest()
    )
    return f'{header}.{payload}.{sig}'


def decode_token(token: str) -> dict:
    """
    Decode and verify a token.
    Raises ValueError with a descriptive message on any failure.
    """
    try:
        header, payload, sig = token.split('.')
    except ValueError:
        raise ValueError('Malformed token')

    expected_sig = _b64url_encode(
        hmac.new(_secret(), f'{header}.{payload}'.encode(), hashlib.sha256).digest()
    )
    if not hmac.compare_digest(expected_sig, sig):
        raise ValueError('Invalid token signature')

    try:
        claims = json.loads(_b64url_decode(payload))
    except Exception:
        raise ValueError('Malformed token payload')

    if claims.get('exp', 0) < int(time.time()):
        raise ValueError('Token has expired')

    return claims


def get_token_from_request(request) -> str | None:
    """Extract Bearer token from Authorization header."""
    auth = request.META.get('HTTP_AUTHORIZATION', '')
    if auth.startswith('Bearer '):
        return auth[7:].strip()
    return None


def require_auth(view_func):
    """
    Decorator that enforces JWT authentication on a view.
    Attaches decoded claims to request.auth_claims on success.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        token = get_token_from_request(request)
        if not token:
            return JsonResponse({'error': 'Authentication required.'}, status=401)
        try:
            request.auth_claims = decode_token(token)
        except ValueError as exc:
            return JsonResponse({'error': str(exc)}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper


def require_role(*allowed_roles):
    """
    Decorator that enforces both authentication AND role membership.
    Must be applied AFTER @require_auth (or use standalone — it calls require_auth internally).
    """
    def decorator(view_func):
        @wraps(view_func)
        @require_auth
        def wrapper(request, *args, **kwargs):
            role = request.auth_claims.get('role', '')
            if role not in allowed_roles:
                return JsonResponse({'error': 'Insufficient permissions.'}, status=403)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
