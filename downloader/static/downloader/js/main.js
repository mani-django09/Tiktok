document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.querySelector('.url-input');
    const downloadBtn = document.querySelector('.download-btn');
    const form = document.querySelector('.download-form');
    let isProcessing = false;

    // Initialize form handlers
    initializeFormHandlers();

    function initializeFormHandlers() {
        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!isProcessing) {
                handleVideoInfo();
            }
        });

        // Handle download button click
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isProcessing) {
                handleVideoInfo();
            }
        });

        // Handle paste button if exists
        const pasteBtn = document.querySelector('.paste-btn');
        if (pasteBtn) {
            pasteBtn.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    urlInput.value = text;
                    urlInput.focus();
                } catch (err) {
                    showError('Failed to paste from clipboard');
                }
            });
        }
    }

    async function handleVideoInfo() {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('Please enter a TikTok URL');
            return;
        }

        if (!isValidTikTokUrl(url)) {
            showError('Please enter a valid TikTok URL');
            return;
        }

        isProcessing = true;
        showLoading();

        try {
            // Add delay before API call to handle rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

            const infoResponse = await fetch('/api/video-info/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ url })
            });

            const infoData = await infoResponse.json();

            if (infoData.status === 'success') {
                showVideoPreview(infoData.data);
            } else {
                handleApiError(infoData);
            }
        } catch (error) {
            handleApiError(error);
        } finally {
            isProcessing = false;
            hideLoading();
        }
    }

    function showVideoPreview(videoData) {
        // Remove any existing preview
        const existingPreview = document.querySelector('.video-preview');
        if (existingPreview) {
            existingPreview.remove();
        }

        const previewHTML = `
            <div class="video-preview">
                <div class="preview-content">
                    <div class="thumbnail-container">
                        <img src="${videoData.thumbnail}" alt="Video thumbnail" class="video-thumbnail">
                        <div class="video-stats">
                            <span><i class="fas fa-heart"></i> ${formatNumber(videoData.likes)}</span>
                            <span><i class="fas fa-play"></i> ${formatNumber(videoData.plays)}</span>
                            <span><i class="fas fa-share"></i> ${formatNumber(videoData.shares)}</span>
                        </div>
                    </div>
                    <div class="video-info">
                        <h3 class="video-title">${videoData.title || 'TikTok Video'}</h3>
                        <p class="video-author">@${videoData.author}</p>
                    </div>
                </div>

                <div class="download-options">
                    <h4>Select Quality</h4>
                    <div class="quality-buttons">
                        <button class="quality-btn active" data-quality="hd">
                            <i class="fas fa-video"></i>
                            <div class="quality-info">
                                <span>HD Quality</span>
                                <small>High Definition MP4</small>
                            </div>
                        </button>
                        <button class="quality-btn" data-quality="sd">
                            <i class="fas fa-video"></i>
                            <div class="quality-info">
                                <span>SD Quality</span>
                                <small>Standard Definition MP4</small>
                            </div>
                        </button>
                        <button class="quality-btn" data-quality="audio">
                            <i class="fas fa-music"></i>
                            <div class="quality-info">
                                <span>Audio Only</span>
                                <small>MP3 Format</small>
                            </div>
                        </button>
                    </div>

                    <div class="watermark-option">
                        <label class="toggle-container">
                            <input type="checkbox" id="removeWatermark" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Remove Watermark</span>
                        </label>
                    </div>

                    <button class="start-download-btn" onclick="startDownload('${videoData.url}')">
                        <i class="fas fa-download"></i> Download Now
                    </button>
                </div>
            </div>
        `;

        // Insert preview after the form
        form.insertAdjacentHTML('afterend', previewHTML);

        // Initialize quality buttons
        initializeQualityButtons();
    }

    function initializeQualityButtons() {
        const qualityButtons = document.querySelectorAll('.quality-btn');
        qualityButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                qualityButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    // Make startDownload function globally available
    window.startDownload = async function(url) {
        const selectedQuality = document.querySelector('.quality-btn.active').dataset.quality;
        const removeWatermark = document.getElementById('removeWatermark').checked;
        const downloadBtn = document.querySelector('.start-download-btn');

        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            const response = await fetch('/api/process/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    url,
                    quality: selectedQuality,
                    remove_watermark: removeWatermark
                })
            });

            const data = await response.json();

            if (data.status === 'success' && data.download_url) {
                showSuccess('Starting download...');
                setTimeout(() => {
                    window.location.href = data.download_url;
                }, 1000);
            } else {
                handleApiError(data);
            }
        } catch (error) {
            handleApiError(error);
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Now';
        }
    };

    function handleApiError(error) {
        if (error.message?.includes('Api Limit')) {
            showError('Please wait a moment before trying again');
            // Retry after delay
            setTimeout(() => {
                if (!isProcessing) {
                    handleVideoInfo();
                }
            }, 2000);
        } else {
            showError(error.message || 'An error occurred. Please try again.');
        }
    }

    function showLoading() {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `
            <span class="loading-spinner"></span>
            <span>Processing...</span>
        `;
    }

    function hideLoading() {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = 'Download';
    }

    function showError(message) {
        removeMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        form.appendChild(errorDiv);
        
        // Only auto-remove if it's not a rate limit error
        if (!message.includes('wait')) {
            setTimeout(() => errorDiv.remove(), 3000);
        }
    }

    function showSuccess(message) {
        removeMessages();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'message success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        form.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }

    function removeMessages() {
        const messages = form.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
    }

    function formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    function isValidTikTokUrl(url) {
        return url.toLowerCase().includes('tiktok.com/') && 
               (url.startsWith('http://') || url.startsWith('https://'));
    }

    function getCsrfToken() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
                return value;
            }
        }
        return '';
    }
});