document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.querySelector('.url-input');
    const downloadBtn = document.querySelector('.download-btn');
    const form = document.querySelector('.download-form');
    let isProcessing = false;

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isProcessing) {
            handleDownload();
        }
    });

    // Handle download button click
    downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isProcessing) {
            handleDownload();
        }
    });

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

        isProcessing = true;
        showLoading();

        try {
            // Add delay before API call to handle rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

            // First, get video info
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
                // Add delay before processing to handle rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Now process the video
                const processResponse = await fetch('/api/process/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCsrfToken()
                    },
                    body: JSON.stringify({
                        url: url,
                        quality: 'hd',
                        remove_watermark: true
                    })
                });

                const processData = await processResponse.json();

                if (processData.status === 'success' && processData.download_url) {
                    showSuccess('Starting download...');
                    setTimeout(() => {
                        window.location.href = processData.download_url;
                    }, 1000);
                } else {
                    handleApiError(processData);
                }
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

    function handleApiError(error) {
        if (error.message?.includes('Api Limit')) {
            showError('Please wait a moment before trying again');
            // Retry after delay
            setTimeout(() => {
                if (!isProcessing) {
                    handleDownload();
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
    }

    function removeMessages() {
        const messages = form.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
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