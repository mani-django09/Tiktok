document.addEventListener('DOMContentLoaded', function() {
    const downloadForm = document.querySelector('.download-form');
    const urlInput = document.querySelector('.url-input');
    const downloadBtn = document.querySelector('.download-btn');
    const pasteBtn = document.querySelector('.paste-btn');
    const resultContainer = document.getElementById('resultContainer');

    // Initialize features and animations
    initializeFeatures();
    initializeAnimations();

    // Handle paste button
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            urlInput.value = text;
            urlInput.focus();
        } catch (err) {
            showError('Failed to paste from clipboard. Please paste manually.');
        }
    });

    // Handle form submission
    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        handleDownload();
    });

    // Handle download button click
    downloadBtn.addEventListener('click', handleDownload);

    async function handleDownload() {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('Please enter a TikTok URL');
            return;
        }

        if (!isValidTikTokUrl(url)) {
            showError('Please enter a valid TikTok URL');
            return;
        }

        showLoading();

        try {
            const response = await fetch('/api/video-info/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (data.status === 'success') {
                showVideoPreview(data.data); // Note: accessing data.data based on your views.py response
            } else {
                throw new Error(data.message || 'Failed to fetch video information');
            }
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    function showVideoPreview(data) {
        resultContainer.innerHTML = `
            <div class="video-preview">
                <div class="preview-content">
                    <div class="thumbnail">
                        <img src="${data.thumbnail}" alt="Video thumbnail">
                    </div>
                    <div class="video-info">
                        <h3>${data.title}</h3>
                        <p class="author">@${data.author}</p>
                        <p class="stats">
                            <span><i class="fas fa-play"></i> ${formatNumber(data.plays || 0)}</span>
                            <span><i class="fas fa-heart"></i> ${formatNumber(data.likes || 0)}</span>
                            <span><i class="fas fa-share"></i> ${formatNumber(data.shares || 0)}</span>
                        </p>
                    </div>
                </div>
                <div class="quality-options">
                    <button class="quality-btn active" data-quality="hd">
                        <i class="fas fa-video"></i>
                        <span>HD Video</span>
                        <small>MP4 - High Quality</small>
                    </button>
                    <button class="quality-btn" data-quality="sd">
                        <i class="fas fa-video"></i>
                        <span>SD Video</span>
                        <small>MP4 - Smaller Size</small>
                    </button>
                    <button class="quality-btn" data-quality="audio">
                        <i class="fas fa-music"></i>
                        <span>Audio Only</span>
                        <small>MP3 Format</small>
                    </button>
                </div>
                <div class="download-options">
                    <label class="watermark-toggle">
                        <input type="checkbox" id="removeWatermark" checked>
                        <span>Remove Watermark</span>
                    </label>
                    <button class="start-download-btn" onclick="startDownload('${data.url}')">
                        <i class="fas fa-download"></i> Download Now
                    </button>
                </div>
            </div>
        `;

        initializeQualityButtons();
    }

    // Make startDownload accessible globally
    window.startDownload = async (url) => {
        const quality = document.querySelector('.quality-btn.active').dataset.quality;
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
                    quality,
                    remove_watermark: removeWatermark
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Start download
                window.location.href = data.download_url;
                showSuccess('Download started!');
            } else {
                throw new Error(data.message || 'Download failed');
            }
        } catch (error) {
            showError(error.message);
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Now';
        }
    };

    function initializeQualityButtons() {
        const qualityButtons = document.querySelectorAll('.quality-btn');
        qualityButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                qualityButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    function showLoading() {
        resultContainer.innerHTML = `
            <div class="loading-state">
                <div class="loader"></div>
                <p>Analyzing video...</p>
            </div>
        `;
    }

    function hideLoading() {
        const loadingState = document.querySelector('.loading-state');
        if (loadingState) {
            loadingState.remove();
        }
    }

    function showError(message) {
        resultContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    function showSuccess(message) {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <p>${message}</p>
        `;
        resultContainer.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
    }

    function isValidTikTokUrl(url) {
        return url.toLowerCase().includes('tiktok.com/') && url.startsWith('http');
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

    function initializeFeatures() {
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => {
                item.classList.toggle('active');
            });
        });
    }

    function initializeAnimations() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1 }
        );

        animatedElements.forEach(element => observer.observe(element));
    }
});