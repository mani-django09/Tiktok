from django.shortcuts import render
from django.http import JsonResponse, FileResponse
from django.views.decorators.http import require_http_methods
from django.core.cache import cache
from .forms import VideoURLForm
from .utils import TikTokDownloader  # Updated import name
from .models import VideoDownload
import os
from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie,csrf_exempt
from .utils import TikTokDownloader
import logging
import time


logger = logging.getLogger(__name__)

@ensure_csrf_cookie

@require_http_methods(["GET"])
def home(request):
    form = VideoURLForm()
    return render(request, 'downloader/home.html', {'form': form})


@csrf_exempt
def process_video(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'})

    try:
        url = request.POST.get('url')
        quality = request.POST.get('quality', 'hd')
        remove_watermark = request.POST.get('remove_watermark', 'false') == 'true'

        if not url:
            return JsonResponse({
                'status': 'error',
                'message': 'URL is required'
            })

        print(f"Processing download: {url}, Quality: {quality}")  # Debug log
        downloader = TikTokDownloader()
        filename = downloader.download_video(url, quality, remove_watermark)

        return JsonResponse({
            'status': 'success',
            'message': 'Video downloaded successfully!',
            'download_url': f'/download/{filename}'
        })

    except Exception as e:
        print(f"Error in process_video view: {str(e)}")  # Debug log
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })



@csrf_exempt
def process_video(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'})

    try:
        url = request.POST.get('url')
        quality = request.POST.get('quality', 'hd')
        remove_watermark = request.POST.get('remove_watermark', 'false') == 'true'

        if not url:
            return JsonResponse({
                'status': 'error',
                'message': 'URL is required'
            })

        # Try up to 3 times with delay
        max_retries = 3
        for attempt in range(max_retries):
            try:
                downloader = TikTokDownloader()
                filename = downloader.download_video(url, quality, remove_watermark)
                return JsonResponse({
                    'status': 'success',
                    'message': 'Video downloaded successfully!',
                    'download_url': f'/download/{filename}'
                })
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                time.sleep(1)  # Wait 1 second before retry

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })


@csrf_exempt
def get_video_info(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'})
    
    try:
        url = request.POST.get('url')
        if not url:
            return JsonResponse({
                'status': 'error',
                'message': 'URL is required'
            })

        # Try up to 3 times with delay
        max_retries = 3
        for attempt in range(max_retries):
            try:
                downloader = TikTokDownloader()
                info = downloader.get_video_info(url)
                return JsonResponse(info)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                time.sleep(1)  # Wait 1 second before retry

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })

def download_file(request, filename):
    try:
        file_path = os.path.join(settings.MEDIA_ROOT, 'downloads', filename)
        if os.path.exists(file_path):
            response = FileResponse(open(file_path, 'rb'))
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Type'] = 'video/mp4'
            return response
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'File not found'
            })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })