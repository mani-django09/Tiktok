import requests
import re
import os
import json
import uuid
from django.conf import settings
import time

class TikTokDownloader:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def get_video_info(self, url):
        """Get video information using multiple fallback methods"""
        methods = [
            self._get_info_method1,
            self._get_info_method2,
            self._get_info_method3
        ]

        last_error = None
        for method in methods:
            try:
                return method(url)
            except Exception as e:
                last_error = str(e)
                continue

        raise ValueError(f"Failed to get video information: {last_error}")

    def _get_info_method1(self, url):
        """TikTok API method"""
        try:
            video_id = self._extract_video_id(url)
            if not video_id:
                raise ValueError("Could not extract video ID")

            api_url = f"https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id={video_id}"
            response = self.session.get(api_url)
            data = response.json()

            video_data = data['aweme_list'][0]
            return {
                'status': 'success',
                'title': video_data.get('desc', 'TikTok Video'),
                'author': f"@{video_data.get('author', {}).get('unique_id', 'user')}",
                'thumbnail': video_data.get('video', {}).get('cover', {}).get('url_list', [''])[0],
                'download_urls': {
                    'hd': video_data.get('video', {}).get('play_addr', {}).get('url_list', [''])[0],
                    'sd': video_data.get('video', {}).get('play_addr', {}).get('url_list', [''])[0]
                }
            }
        except Exception:
            raise

    def _get_info_method2(self, url):
        """Alternative API method"""
        try:
            api_url = "https://www.tikwm.com/api/"
            response = self.session.post(api_url, data={'url': url})
            data = response.json()

            if data.get('code') != 0:
                raise ValueError(data.get('msg', 'API error'))

            video_data = data.get('data', {})
            return {
                'status': 'success',
                'title': video_data.get('title', 'TikTok Video'),
                'author': f"@{video_data.get('author', {}).get('unique_id', 'user')}",
                'thumbnail': video_data.get('cover', ''),
                'download_urls': {
                    'hd': video_data.get('hdplay', ''),
                    'sd': video_data.get('play', '')
                }
            }
        except Exception:
            raise

    def _get_info_method3(self, url):
        """Direct web scraping method"""
        try:
            response = self.session.get(url)
            matches = re.findall(r'"downloadAddr":"([^"]+)"', response.text)
            if not matches:
                raise ValueError("Could not find video URL")

            video_url = matches[0].encode().decode('unicode-escape')
            return {
                'status': 'success',
                'title': 'TikTok Video',
                'author': '@user',
                'thumbnail': '',
                'download_urls': {
                    'hd': video_url,
                    'sd': video_url
                }
            }
        except Exception:
            raise

    def download_video(self, url, quality='hd', remove_watermark=False):
        """Fast video download with multiple fallback methods"""
        try:
            # Get video info
            info = self.get_video_info(url)
            
            # Create downloads directory
            downloads_dir = os.path.join(settings.MEDIA_ROOT, 'downloads')
            os.makedirs(downloads_dir, exist_ok=True)

            # Generate filename
            filename = f"tiktok_{uuid.uuid4().hex[:8]}.mp4"
            file_path = os.path.join(downloads_dir, filename)

            # Get download URL
            download_url = info['download_urls']['hd'] if quality == 'hd' and info['download_urls']['hd'] else info['download_urls']['sd']

            if not download_url:
                raise ValueError("No download URL available")

            # Download video with large chunks for speed
            response = self.session.get(download_url, stream=True)
            response.raise_for_status()

            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=1024*1024):  # 1MB chunks
                    if chunk:
                        f.write(chunk)

            if os.path.getsize(file_path) < 1024:
                os.remove(file_path)
                raise ValueError("Downloaded file is invalid")

            return filename

        except Exception as e:
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
            raise ValueError(f"Download failed: {str(e)}")

    def _extract_video_id(self, url):
        """Extract video ID from TikTok URL"""
        patterns = [
            r'/video/(\d+)',
            r'/v/(\d+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    def _clean_url(self, url):
        """Clean and validate TikTok URL"""
        try:
            # Remove query parameters
            url = url.split('?')[0]
            if not any(domain in url.lower() for domain in ['tiktok.com', 'vm.tiktok.com']):
                raise ValueError("Not a valid TikTok URL")
            return url
        except Exception:
            raise ValueError("Invalid URL format")