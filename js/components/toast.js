// Toast Component
import { CONFIG } from '../config.js';

export class Toast {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.maxToasts = 5;
        this.defaultDuration = CONFIG.TOAST_DURATION;
        
        this.init();
    }
    
    init() {
        // Get or create toast container
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.createContainer();
        }
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toastContainer';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }
    
    // Show toast
    show(message, type = 'info', options = {}) {
        const toastId = this.generateId();
        const duration = options.duration || this.defaultDuration;
        const title = options.title || this.getDefaultTitle(type);
        const showProgress = options.showProgress !== false;
        const action = options.action || null;
        
        // Create toast element
        const toast = this.createToast(toastId, title, message, type, showProgress, action);
        
        // Add to container
        this.container.appendChild(toast);
        
        // Store toast reference
        this.toasts.set(toastId, {
            element: toast,
            timer: null,
            type: type,
            message: message
        });
        
        // Limit number of toasts
        this.limitToasts();
        
        // Show toast with animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto-hide after duration
        if (duration > 0) {
            const timer = setTimeout(() => {
                this.hide(toastId);
            }, duration);
            
            this.toasts.get(toastId).timer = timer;
        }
        
        // Setup event listeners
        this.setupToastEvents(toastId, toast);
        
        return toastId;
    }
    
    // Create toast element
    createToast(id, title, message, type, showProgress, action) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.dataset.toastId = id;
        
        const icon = this.getIcon(type);
        const progressBar = showProgress ? '<div class="toast-progress"></div>' : '';
        const actionButton = action ? `<button class="toast-action-btn">${action.text}</button>` : '';
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            ${actionButton}
            <button class="toast-close">
                <svg viewBox="0 0 24 24">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
            </button>
            ${progressBar}
        `;
        
        return toast;
    }
    
    // Setup toast event listeners
    setupToastEvents(toastId, toast) {
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide(toastId);
            });
        }
        
        // Action button
        const actionBtn = toast.querySelector('.toast-action-btn');
        if (actionBtn) {
            actionBtn.addEventListener('click', () => {
                const toastData = this.toasts.get(toastId);
                if (toastData && toastData.action && toastData.action.callback) {
                    toastData.action.callback();
                }
                this.hide(toastId);
            });
        }
        
        // Pause timer on hover
        toast.addEventListener('mouseenter', () => {
            this.pauseTimer(toastId);
        });
        
        // Resume timer on leave
        toast.addEventListener('mouseleave', () => {
            this.resumeTimer(toastId);
        });
    }
    
    // Hide toast
    hide(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;
        
        const toast = toastData.element;
        
        // Clear timer
        if (toastData.timer) {
            clearTimeout(toastData.timer);
        }
        
        // Hide with animation
        toast.classList.add('hide');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(toastId);
        }, 300);
    }
    
    // Hide all toasts
    hideAll() {
        const toastIds = Array.from(this.toasts.keys());
        toastIds.forEach(id => this.hide(id));
    }
    
    // Success toast
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }
    
    // Error toast
    error(message, options = {}) {
        return this.show(message, 'error', {
            ...options,
            duration: options.duration || 0 // Don't auto-hide errors
        });
    }
    
    // Warning toast
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }
    
    // Info toast
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }
    
    // Toast with action
    action(message, actionText, actionCallback, options = {}) {
        return this.show(message, options.type || 'info', {
            ...options,
            action: {
                text: actionText,
                callback: actionCallback
            }
        });
    }
    
    // Loading toast
    loading(message, options = {}) {
        const toastId = this.show(message, 'info', {
            ...options,
            duration: 0, // Don't auto-hide
            showProgress: false
        });
        
        // Add loading spinner
        const toast = this.toasts.get(toastId)?.element;
        if (toast) {
            const icon = toast.querySelector('.toast-icon');
            if (icon) {
                icon.innerHTML = '<div class="ring-spinner spinner-sm"></div>';
            }
        }
        
        return {
            id: toastId,
            update: (newMessage) => this.updateMessage(toastId, newMessage),
            success: (successMessage) => {
                this.hide(toastId);
                return this.success(successMessage);
            },
            error: (errorMessage) => {
                this.hide(toastId);
                return this.error(errorMessage);
            },
            hide: () => this.hide(toastId)
        };
    }
    
    // Update toast message
    updateMessage(toastId, newMessage) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;
        
        const messageEl = toastData.element.querySelector('.toast-message');
        if (messageEl) {
            messageEl.textContent = newMessage;
            toastData.message = newMessage;
        }
    }
    
    // Update toast title
    updateTitle(toastId, newTitle) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;
        
        const titleEl = toastData.element.querySelector('.toast-title');
        if (titleEl) {
            titleEl.textContent = newTitle;
        }
    }
    
    // Pause timer
    pauseTimer(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData || !toastData.timer) return;
        
        clearTimeout(toastData.timer);
        toastData.timer = null;
        
        // Pause progress animation
        const progressBar = toastData.element.querySelector('.toast-progress');
        if (progressBar) {
            progressBar.style.animationPlayState = 'paused';
        }
    }
    
    // Resume timer
    resumeTimer(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;
        
        // Resume progress animation
        const progressBar = toastData.element.querySelector('.toast-progress');
        if (progressBar) {
            progressBar.style.animationPlayState = 'running';
        }
        
        // Set new timer for remaining duration
        const remainingTime = this.getRemainingTime(toastData.element);
        if (remainingTime > 0) {
            toastData.timer = setTimeout(() => {
                this.hide(toastId);
            }, remainingTime);
        }
    }
    
    // Get remaining time from progress bar
    getRemainingTime(toast) {
        const progressBar = toast.querySelector('.toast-progress');
        if (!progressBar) return 0;
        
        const computedStyle = window.getComputedStyle(progressBar);
        const animationDuration = parseFloat(computedStyle.animationDuration) * 1000;
        const animationDelay = parseFloat(computedStyle.animationDelay) * 1000;
        
        // This is an approximation - in a real implementation,
        // you might want to track the exact remaining time
        return Math.max(0, animationDuration - animationDelay);
    }
    
    // Limit number of toasts
    limitToasts() {
        const toastElements = this.container.querySelectorAll('.toast');
        
        if (toastElements.length > this.maxToasts) {
            // Remove oldest toasts
            const toastsToRemove = toastElements.length - this.maxToasts;
            
            for (let i = 0; i < toastsToRemove; i++) {
                const oldestToast = toastElements[i];
                const toastId = oldestToast.dataset.toastId;
                if (toastId) {
                    this.hide(toastId);
                }
            }
        }
    }
    
    // Generate unique ID
    generateId() {
        return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Get default title for type
    getDefaultTitle(type) {
        const titles = {
            success: 'สำเร็จ',
            error: 'ข้อผิดพลาด',
            warning: 'คำเตือน',
            info: 'ข้อมูล'
        };
        
        return titles[type] || 'แจ้งเตือน';
    }
    
    // Get icon for type
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        return icons[type] || 'ℹ';
    }
    
    // Get toast count
    getCount() {
        return this.toasts.size;
    }
    
    // Get all toasts
    getAll() {
        return Array.from(this.toasts.values());
    }
    
    // Clear all toasts
    clear() {
        this.hideAll();
    }
    
    // Set max toasts
    setMaxToasts(max) {
        this.maxToasts = Math.max(1, max);
        this.limitToasts();
    }
    
    // Set default duration
    setDefaultDuration(duration) {
        this.defaultDuration = Math.max(0, duration);
    }
    
    // Destroy toast system
    destroy() {
        this.hideAll();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.toasts.clear();
    }
}

// Create and export singleton instance
export const toast = new Toast();

export default Toast;