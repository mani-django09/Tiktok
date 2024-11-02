from django import forms
import re

class VideoURLForm(forms.Form):
    url = forms.URLField(
        widget=forms.URLInput(attrs={
            'class': 'form-control',
            'placeholder': 'Paste TikTok video URL here',
            'autocomplete': 'off'
        })
    )

    def clean_url(self):
        url = self.cleaned_data['url']
        if 'tiktok.com' not in url:
            raise forms.ValidationError('Please enter a valid TikTok URL')
        return url