from django.urls import path
from . import views

app_name = 'downloader'

urlpatterns = [
    path('', views.home, name='home'),
    path('get_video_info/', views.get_video_info, name='get_video_info'),
    path('process/', views.process_video, name='process_video'),
    path('download/<str:filename>', views.download_file, name='download_file'),
]