from django.db import models
from django.utils import timezone

class VideoDownload(models.Model):
    url = models.URLField(max_length=500)
    download_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    last_downloaded = models.DateTimeField(auto_now=True)
    file_path = models.CharField(max_length=500, null=True, blank=True)
    
    def __str__(self):
        return f"Video: {self.url} (Downloaded: {self.download_count} times)"

