document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initDownloadForm();
    initTabButtons();
    initFeatureCards();
    initFAQ();
    initAnimations();
    initializeHeader();
    // Initialize from stored format
    const storedFormat = localStorage.getItem('selectedFormat') || 'mp4';
    setActiveFormat(storedFormat);
});

function initDownloadForm() {
    const form = document.getElementById('downloadForm');
    const urlInput = document.querySelector('.url-input');
    const pasteBtn = document.querySelector('.paste-btn');
    const resultContainer = document.getElementById('resultContainer');

    // Handle paste button
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            urlInput.value = text;
            urlInput.focus();
        } catch (err) {
            showError('Failed to paste from clipboard');
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
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
            // Simulated API call (replace with actual API endpoint)
            setTimeout(() => {
                const mockData = {
                    title: 'Sample TikTok Video',
                    author: '@username',
                    thumbnail: '/static/images/placeholder.jpg'
                };
                showVideoPreview(mockData);
            }, 1500);
        } catch (error) {
            showError(error.message);
        }
    });
}

function initTabButtons() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateFormForFormat(btn.dataset.format);
        });
    });
}

function initFeatureCards() {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('hovered');
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('hovered');
        });
    });
}

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            item.classList.toggle('active');
        });
    });
}

function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// Utility Functions
function showLoading() {
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `
        <div class="loading-state">
            <div class="loader"></div>
            <p>Processing your video...</p>
        </div>
    `;
}

function showError(message) {
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

function showVideoPreview(data) {
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `
        <div class="video-preview animate-fade-in">
            <div class="preview-content">
                <div class="thumbnail">
                    <img src="${data.thumbnail}" alt="Video thumbnail">
                </div>
                <div class="video-info">
                    <h3>${data.title}</h3>
                    <p class="author">${data.author}</p>
                </div>
            </div>
            <div class="quality-options">
                <button class="quality-btn active" data-quality="hd">HD Quality</button>
                <button class="quality-btn" data-quality="sd">SD Quality</button>
                <button class="quality-btn" data-quality="audio">Audio Only</button>
            </div>
            <button class="download-btn" onclick="startDownload()">
                <i class="fas fa-download"></i>
                <span>Download Now</span>
            </button>
        </div>
    `;
    initQualityButtons();
}

function initQualityButtons() {
    const qualityButtons = document.querySelectorAll('.quality-btn');
    qualityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            qualityButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function isValidTikTokUrl(url) {
    return url.toLowerCase().includes('tiktok.com/');
}

function updateFormForFormat(format) {
    const downloadBtn = document.querySelector('.download-btn');
    downloadBtn.innerHTML = format === 'video'
        ? `<i class="fas fa-video"></i><span>Download Video</span>`
        : `<i class="fas fa-music"></i><span>Download Audio</span>`;
}

// Download function
window.startDownload = function() {
    showLoading();
    setTimeout(() => {
        showSuccess('Download started successfully!');
    }, 1500);
};

function showSuccess(message) {
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `
        <div class="success-message">
            <i class="fas fa-check-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Header functionality
function initializeHeader() {
    const header = document.querySelector('.site-header');
    const progressBar = document.querySelector('.scroll-progress-bar');

    // Header scroll effect
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        header.classList.toggle('scrolled', currentScroll > 50);

        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        progressBar.style.width = `${scrollPercent}%`;
    });
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuBtn = document.querySelector('.mobile-menu-btn i');
    
    mobileMenu.classList.toggle('active');
    
    menuBtn.classList.toggle('fa-bars', !mobileMenu.classList.contains('active'));
    menuBtn.classList.toggle('fa-times', mobileMenu.classList.contains('active'));
}

// Format switching function
function setActiveFormat(format) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll(`.${format}-btn`).forEach(btn => btn.classList.add('active'));
    
    localStorage.setItem('selectedFormat', format);
    
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu.classList.contains('active')) {
        toggleMobileMenu();
    }
}
