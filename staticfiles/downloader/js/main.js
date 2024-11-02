document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initDownloadForm();
    initHeaderActions();
    initFormatToggle();
    initQualityButtons();
});

function initDownloadForm() {
    const form = document.getElementById('downloadForm');
    const resultDiv = document.getElementById('result');
    const previewSection = document.getElementById('previewSection');
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const url = form.querySelector('input[name="url"]').value;
        if (!url) {
            showError('Please enter a TikTok URL');
            return;
        }

        // Show preview section
        previewSection.style.display = 'block';
        
        // Reset progress
        progressBar.style.width = '0%';
        progressText.textContent = 'Processing video...';
        
        // Animate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += 1;
                progressBar.style.width = `${progress}%`;
            }
        }, 100);

        try {
            // Get video info
            const infoResponse = await fetch('/get_video_info/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `url=${encodeURIComponent(url)}`
            });
            
            const infoData = await infoResponse.json();
            
            if (infoData.status === 'success') {
                // Update preview
                updatePreview(infoData);
                
                // Process download
                const downloadResponse = await fetch('/process/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `url=${encodeURIComponent(url)}&quality=${getSelectedQuality()}&format=${getSelectedFormat()}`
                });
                
                const downloadData = await downloadResponse.json();
                
                clearInterval(progressInterval);
                
                if (downloadData.status === 'success') {
                    progressBar.style.width = '100%';
                    progressText.textContent = 'Download ready!';
                    
                    showSuccess(downloadData);
                    initDownloadButton(downloadData.download_url);
                } else {
                    throw new Error(downloadData.message);
                }
            } else {
                throw new Error(infoData.message);
            }
            
        } catch (error) {
            clearInterval(progressInterval);
            progressBar.style.width = '0%';
            progressText.textContent = 'Error occurred';
            
            showError(error.message || 'Download failed. Please try again.');
        }
    });
}

function initHeaderActions() {
    const headerDownloadBtn = document.getElementById('headerDownloadBtn');
    
    if (headerDownloadBtn) {
        headerDownloadBtn.addEventListener('click', function() {
            const downloadSection = document.querySelector('.download-container');
            if (downloadSection) {
                downloadSection.scrollIntoView({ behavior: 'smooth' });
                
                const urlInput = document.querySelector('input[name="url"]');
                if (urlInput) {
                    setTimeout(() => urlInput.focus(), 500);
                }
            }
        });
    }
}

function initFormatToggle() {
    const formatButtons = document.querySelectorAll('.nav-btn');
    
    formatButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            formatButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update download container class
            const container = document.querySelector('.download-container');
            if (container) {
                container.classList.toggle('mp3-mode', this.classList.contains('mp3-btn'));
            }
        });
    });
}

function initQualityButtons() {
    const qualityButtons = document.querySelectorAll('.quality-btn');
    
    qualityButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            qualityButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function updatePreview(data) {
    document.getElementById('videoThumbnail').src = data.thumbnail || '';
    document.getElementById('videoTitle').textContent = data.title || 'TikTok Video';
    document.getElementById('videoAuthor').textContent = data.author || '@user';
    
    // Show preview with animation
    const previewContent = document.querySelector('.preview-content');
    if (previewContent) {
        previewContent.style.opacity = '0';
        previewContent.style.display = 'block';
        setTimeout(() => {
            previewContent.style.opacity = '1';
        }, 10);
    }
}

function showSuccess(data) {
    const resultDiv = document.getElementById('result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = `
        <div class="success">
            <div class="success-animation">
                <i class="fas fa-check-circle"></i>
            </div>
            <p>${data.message}</p>
            <a href="${data.download_url}" class="download-button" download>
                <i class="fas fa-download"></i> Download Video
            </a>
        </div>
    `;
}

function showError(message) {
    const resultDiv = document.getElementById('result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = `
        <div class="error">
            <div class="error-animation">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <p>${message}</p>
        </div>
    `;
}

function getSelectedQuality() {
    const activeQuality = document.querySelector('.quality-btn.active');
    return activeQuality ? activeQuality.dataset.quality : 'hd';
}

function getSelectedFormat() {
    const activeMp3 = document.querySelector('.mp3-btn.active');
    return activeMp3 ? 'mp3' : 'mp4';
}

function initDownloadButton(url) {
    const headerDownloadBtn = document.getElementById('headerDownloadBtn');
    if (headerDownloadBtn) {
        headerDownloadBtn.classList.add('ready');
        headerDownloadBtn.addEventListener('click', function() {
            window.location.href = url;
        }, { once: true });
    }
}

// Utility function for smooth scrolling
function smoothScroll(target, duration = 500) {
    const targetPosition = target.getBoundingClientRect().top;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

// Add copy URL functionality
function addCopyUrlButton() {
    const urlInput = document.querySelector('input[name="url"]');
    if (!urlInput) return;

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
    copyButton.addEventListener('click', function() {
        urlInput.select();
        document.execCommand('copy');
        
        this.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    });

    urlInput.parentNode.appendChild(copyButton);
}

// Initialize copy button when document is ready
document.addEventListener('DOMContentLoaded', function() {
    addCopyUrlButton();
});