"""
api/middleware.py — in-process rate limiter for the login endpoint.

Uses a simple in-memory sliding-window counter per IP.
For multi-process / multi-server deployments replace with Redis-backed
django-axes or django-ratelimit.
"""
import time
import threading
from django.http import JsonResponse

_lock   = threading.Lock()
_window = {}   # { ip: [(timestamp, …), …] }

LOGIN_PATH        = '/api/auth/login/'
MAX_ATTEMPTS      = 10          # per window
WINDOW_SECONDS    = 60          # rolling window
LOCKOUT_SECONDS   = 300         # 5-minute lockout after MAX_ATTEMPTS


class LoginRateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path == LOGIN_PATH and request.method == 'POST':
            ip = self._get_ip(request)
            if self._is_blocked(ip):
                return JsonResponse(
                    {'error': 'Too many login attempts. Please try again later.'},
                    status=429,
                )
        return self.get_response(request)

    @staticmethod
    def _get_ip(request) -> str:
        xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
        return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', '')

    @staticmethod
    def _is_blocked(ip: str) -> bool:
        now = time.time()
        with _lock:
            attempts = _window.get(ip, [])
            # Prune old entries outside the rolling window
            attempts = [t for t in attempts if now - t < WINDOW_SECONDS]
            attempts.append(now)
            _window[ip] = attempts
            return len(attempts) > MAX_ATTEMPTS
