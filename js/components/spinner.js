// Spinner Component
import { CONFIG } from '../config.js';

export class Spinner {
    constructor() {
        this.overlay = null;
        this.isVisible = false;
        this.currentMessage = '';
        this.progressValue = 0;
        this.progressText = '';
        
        this.init();
    }
    
    init() {
        // Get or create spinner overlay
        this.overlay = document.getElementById('loadingSpinner');
        if (!this.overlay) {
            this.createOverlay();
        }
        
        this.setupElements();
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'loadingSpinner';
        this.overlay.className = 'spinner-overlay';
        this.overlay.innerHTML = `
            <div class="spinner-container">
                <div class="futuristic-spinner"></div>
                <p class="spinner-text">กำลังโหลด...</p>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-text" id="progressText">0%</div>
            </div>
        `;
        document.body.appendChild(this.overlay);
    }
    
    setupElements() {
        this.messageEl = this.overlay.querySelector('.spinner-text');
        this.progressFill = this.overlay.querySelector('.progress-fill');
        this.progressTextEl = this.overlay.querySelector('.progress-text');
    }
    
    // Show spinner
    show(message = 'กำลังโหลด...', showProgress = false) {
        if (this.isVisible) return;
        
        this.currentMessage = message;
        this.updateMessage(message);
        
        // Show/hide progress bar
        const progressBar = this.overlay.querySelector('.progress-bar');
        const progressText = this.overlay.querySelector('.progress-text');
        
        if (showProgress) {
            progressBar.style.display = 'block';
            progressText.style.display = 'block';
            this.setProgress(0);
        } else {
            progressBar.style.display = 'none';
            progressText.style.display = 'none';
        }
        
        // Show overlay
        this.overlay.classList.add('active');
        this.isVisible = true;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        return this;
    }
    
    // Hide spinner
    hide() {
        if (!this.isVisible) return;
        
        this.overlay.classList.remove('active');
        this.isVisible = false;
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Reset progress
        this.setProgress(0);
        
        return this;
    }
    
    // Update message
    updateMessage(message) {
        if (this.messageEl) {
            this.messageEl.textContent = message;
        }
        this.currentMessage = message;
        return this;
    }
    
    // Set progress (0-100)
    setProgress(value, text = null) {
        this.progressValue = Math.max(0, Math.min(100, value));
        
        if (this.progressFill) {
            this.progressFill.style.width = `${this.progressValue}%`;
        }
        
        if (this.progressTextEl) {
            this.progressText = text || `${Math.round(this.progressValue)}%`;
            this.progressTextEl.textContent = this.progressText;
        }
        
        return this;
    }
    
    // Increment progress
    incrementProgress(amount = 1, text = null) {
        return this.setProgress(this.progressValue + amount, text);
    }
    
    // Simulate loading progress
    simulateProgress(duration = 2000, steps = 20) {
        return new Promise((resolve) => {
            const stepDuration = duration / steps;
            const stepAmount = 100 / steps;
            let currentStep = 0;
            
            const interval = setInterval(() => {
                currentStep++;
                const progress = (currentStep / steps) * 100;
                
                this.setProgress(progress);
                
                if (currentStep >= steps) {
                    clearInterval(interval);
                    resolve();
                }
            }, stepDuration);
        });
    }
    
    // Show with auto-hide
    showWithAutoHide(message = 'กำลังโหลด...', duration = CONFIG.LOADING_MIN_DURATION) {
        this.show(message);
        
        setTimeout(() => {
            this.hide();
        }, duration);
        
        return this;
    }
    
    // Show with promise
    showWithPromise(promise, message = 'กำลังโหลด...', minDuration = CONFIG.LOADING_MIN_DURATION) {
        this.show(message);
        
        const startTime = Date.now();
        
        return promise.finally(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, minDuration - elapsed);
            
            setTimeout(() => {
                this.hide();
            }, remaining);
        });
    }
    
    // Create inline spinner
    createInlineSpinner(size = 'md') {
        const spinner = document.createElement('div');
        spinner.className = `spinner-inline spinner-${size}`;
        
        const sizeMap = {
            sm: '16px',
            md: '24px',
            lg: '32px'
        };
        
        const spinnerSize = sizeMap[size] || sizeMap.md;
        
        spinner.innerHTML = `
            <div class="ring-spinner" style="width: ${spinnerSize}; height: ${spinnerSize};"></div>
        `;
        
        return spinner;
    }
    
    // Create dots spinner
    createDotsSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'dots-spinner';
        spinner.innerHTML = `
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        `;
        return spinner;
    }
    
    // Create bars spinner
    createBarsSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'bars-spinner';
        spinner.innerHTML = `
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
        `;
        return spinner;
    }
    
    // Add spinner to element
    addToElement(element, type = 'inline', size = 'md') {
        if (!element) return null;
        
        let spinner;
        
        switch (type) {
            case 'dots':
                spinner = this.createDotsSpinner();
                break;
            case 'bars':
                spinner = this.createBarsSpinner();
                break;
            default:
                spinner = this.createInlineSpinner(size);
        }
        
        element.appendChild(spinner);
        
        return {
            remove: () => {
                if (spinner && spinner.parentNode) {
                    spinner.parentNode.removeChild(spinner);
                }
            }
        };
    }
    
    // Show button loading state
    setButtonLoading(button, loading = true, text = null) {
        if (!button) return;
        
        if (loading) {
            button.classList.add('btn-loading');
            button.disabled = true;
            
            if (text) {
                button.dataset.originalText = button.textContent;
                button.textContent = text;
            }
            
            // Add spinner
            if (!button.querySelector('.spinner-inline')) {
                const spinner = this.createInlineSpinner('sm');
                button.insertBefore(spinner, button.firstChild);
            }
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
            
            // Restore original text
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
                delete button.dataset.originalText;
            }
            
            // Remove spinner
            const spinner = button.querySelector('.spinner-inline');
            if (spinner) {
                spinner.remove();
            }
        }
    }
    
    // Create skeleton loader
    createSkeleton(type = 'text', count = 1) {
        const container = document.createElement('div');
        
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = `skeleton skeleton-${type}`;
            container.appendChild(skeleton);
        }
        
        return container;
    }
    
    // Show page loading
    showPageLoading() {
        const pageLoader = document.createElement('div');
        pageLoader.className = 'page-loading';
        pageLoader.innerHTML = `
            <div class="spinner-container">
                <div class="futuristic-spinner"></div>
                <p class="spinner-text">กำลังโหลดหน้า...</p>
            </div>
        `;
        
        document.body.appendChild(pageLoader);
        
        return {
            hide: () => {
                pageLoader.classList.add('fade-out');
                setTimeout(() => {
                    if (pageLoader.parentNode) {
                        pageLoader.parentNode.removeChild(pageLoader);
                    }
                }, 500);
            }
        };
    }
    
    // Get current state
    getState() {
        return {
            isVisible: this.isVisible,
            message: this.currentMessage,
            progress: this.progressValue,
            progressText: this.progressText
        };
    }
    
    // Check if spinner is visible
    isShowing() {
        return this.isVisible;
    }
    
    // Destroy spinner
    destroy() {
        this.hide();
        
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Create and export singleton instance
export const spinner = new Spinner();

export default Spinner;