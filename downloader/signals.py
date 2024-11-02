from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import VideoDownload
import os
from django.utils import timezone


@receiver(post_save, sender=VideoDownload)
def cleanup_old_files(sender, instance, **kwargs):
    """Clean up old files after a certain threshold"""
    try:
        old_downloads = VideoDownload.objects.filter(
            created_at__lt=timezone.now() - timezone.timedelta(days=1)
        )
        for download in old_downloads:
            if download.file_path and os.path.exists(download.file_path):
                os.remove(download.file_path)
        old_downloads.delete()
    except Exception as e:
        print(f"Error cleaning up old files: {e}")
