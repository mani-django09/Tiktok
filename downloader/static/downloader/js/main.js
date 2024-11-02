// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeApp();
});

function initializeApp() {
    const downloadForm = document.querySelector('.download-form');
    const urlInput = document.querySelector('.url-input');
    const downloadBtn = document.querySelector('.download-btn');
    const pasteBtn = document.querySelector('.paste-btn');
    const resultContainer = document.getElementById('resultContainer');

    // Initialize all features
    initializeFormHandlers();
    initializeTabButtons();
    initializeFeatures();
    initializeAnimations();
    initializeFAQ();

    function initializeFormHandlers() {
        // Handle paste button
        if (pasteBtn) {
            pasteBtn.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    urlInput.value = text;
                    urlInput.focus();
                } catch (err) {
                    showError('Failed to paste from clipboard. Please paste manually.');
                }
            });
        }

        // Handle form submission
        if (downloadForm) {
            downloadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                handleDownload();
            });
        }
    }

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
                showVideoPreview(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch video information');
            }
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    function initializeTabButtons() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateFormForFormat(btn.dataset.format);
            });
        });
    }

    function updateFormForFormat(format) {
        const downloadBtnText = downloadBtn.querySelector('.btn-content');
        if (format === 'video') {
            downloadBtnText.innerHTML = `
                <i class="fas fa-video"></i>
                <span>Download Video</span>
            `;
        } else {
            downloadBtnText.innerHTML = `
                <i class="fas fa-music"></i>
                <span>Download Audio</span>
            `;
        }
    }

    function showVideoPreview(data) {
        resultContainer.innerHTML = `
            <div class="video-preview animate-fade-in">
                <div class="preview-content">
                    <div class="thumbnail">
                        <img src="${data.thumbnail}" alt="Video thumbnail">
                    </div>
                    <div class="video-info">
                        <h3>${data.title}</h3>
                        <p class="author">@${data.author}</p>
                        <div class="stats">
                            <span><i class="fas fa-heart"></i> ${formatNumber(data.likes)}</span>
                            <span><i class="fas fa-play"></i> ${formatNumber(data.plays)}</span>
                            <span><i class="fas fa-share"></i> ${formatNumber(data.shares)}</span>
                        </div>
                    </div>
                </div>
                <div class="quality-options">
                    <button class="quality-btn active" data-quality="hd">
                        <i class="fas fa-video"></i>
                        <span>HD Quality</span>
                        <small>High Definition MP4</small>
                    </button>
                    <button class="quality-btn" data-quality="sd">
                        <i class="fas fa-video"></i>
                        <span>SD Quality</span>
                        <small>Standard Definition MP4</small>
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

    function initializeQualityButtons() {
        const qualityButtons = document.querySelectorAll('.quality-btn');
        qualityButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                qualityButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    function initializeAnimations() {
        // Add fade-in animation to hero content
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.classList.add('animate-fade-in');
        }

        // Initialize scroll animations
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

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    function initializeFAQ() {
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all FAQ items
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                });
                
                // Toggle current item
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    }

    // Utility Functions
    function showLoading() {
        const btnContent = downloadBtn.querySelector('.btn-content');
        const loader = downloadBtn.querySelector('.loader');
        
        btnContent.style.display = 'none';
        loader.style.display = 'block';
        downloadBtn.disabled = true;
    }

    function hideLoading() {
        const btnContent = downloadBtn.querySelector('.btn-content');
        const loader = downloadBtn.querySelector('.loader');
        
        btnContent.style.display = 'flex';
        loader.style.display = 'none';
        downloadBtn.disabled = false;
    }

    function showError(message) {
        resultContainer.innerHTML = `
            <div class="error-message animate-fade-in">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    function showSuccess(message) {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message animate-fade-in';
        successMessage.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <p>${message}</p>
        `;
        resultContainer.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
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
        return url.toLowerCase().includes('tiktok.com/') && url.startsWith('http');
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

    // Make startDownload accessible globally
    window.startDownload = async function(url) {
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
}

// Add these footer-related functions to your existing JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeFooter();
});

function initializeFooter() {
    // Smooth scroll for footer links
    document.querySelectorAll('.footer-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Animate footer sections when they come into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.footer-section').forEach(section => {
        observer.observe(section);
    });
}