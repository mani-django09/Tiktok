from django.http import HttpResponseTooManyRequests
from django.core.cache import cache
import time

class RateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/process/'):
            client_ip = request.META.get('REMOTE_ADDR')
            cache_key = f'rate_limit_{client_ip}'
            
            # Get current request count
            requests = cache.get(cache_key, [])
            now = time.time()
            
            # Remove requests older than 1 hour
            requests = [req for req in requests if now - req < 3600]
            
            if len(requests) >= 10:  # Limit to 10 requests per hour
                return HttpResponseTooManyRequests("Rate limit exceeded")
            
            requests.append(now)
            cache.set(cache_key, requests, 3600)
        
        return self.get_response(request)