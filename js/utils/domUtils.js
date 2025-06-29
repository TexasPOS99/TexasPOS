// DOM Utilities
export class DOMUtils {
    // Create element with attributes and content
    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'dataset') {
                Object.keys(attributes[key]).forEach(dataKey => {
                    element.dataset[dataKey] = attributes[key][dataKey];
                });
            } else if (key === 'style' && typeof attributes[key] === 'object') {
                Object.assign(element.style, attributes[key]);
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        // Set content
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof Node) {
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    }
    
    // Query selector with error handling
    static $(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (error) {
            console.error(`Invalid selector: ${selector}`, error);
            return null;
        }
    }
    
    // Query selector all with error handling
    static $$(selector, context = document) {
        try {
            return Array.from(context.querySelectorAll(selector));
        } catch (error) {
            console.error(`Invalid selector: ${selector}`, error);
            return [];
        }
    }
    
    // Add event listener with cleanup
    static on(element, event, handler, options = {}) {
        if (!element || typeof handler !== 'function') return null;
        
        element.addEventListener(event, handler, options);
        
        // Return cleanup function
        return () => {
            element.removeEventListener(event, handler, options);
        };
    }
    
    // Add event listener that fires once
    static once(element, event, handler, options = {}) {
        if (!element || typeof handler !== 'function') return null;
        
        const wrappedHandler = (e) => {
            handler(e);
            element.removeEventListener(event, wrappedHandler, options);
        };
        
        element.addEventListener(event, wrappedHandler, options);
        
        return () => {
            element.removeEventListener(event, wrappedHandler, options);
        };
    }
    
    // Delegate event listener
    static delegate(parent, selector, event, handler) {
        if (!parent || typeof handler !== 'function') return null;
        
        const delegateHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && parent.contains(target)) {
                handler.call(target, e);
            }
        };
        
        parent.addEventListener(event, delegateHandler);
        
        return () => {
            parent.removeEventListener(event, delegateHandler);
        };
    }
    
    // Add class with animation support
    static addClass(element, className, animate = false) {
        if (!element) return;
        
        if (animate) {
            element.style.transition = 'all 0.3s ease';
        }
        
        element.classList.add(className);
    }
    
    // Remove class with animation support
    static removeClass(element, className, animate = false) {
        if (!element) return;
        
        if (animate) {
            element.style.transition = 'all 0.3s ease';
        }
        
        element.classList.remove(className);
    }
    
    // Toggle class with animation support
    static toggleClass(element, className, animate = false) {
        if (!element) return;
        
        if (animate) {
            element.style.transition = 'all 0.3s ease';
        }
        
        return element.classList.toggle(className);
    }
    
    // Check if element has class
    static hasClass(element, className) {
        return element && element.classList.contains(className);
    }
    
    // Get element position relative to viewport
    static getPosition(element) {
        if (!element) return { top: 0, left: 0, width: 0, height: 0 };
        
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
        };
    }
    
    // Get element offset relative to document
    static getOffset(element) {
        if (!element) return { top: 0, left: 0 };
        
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        return {
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft
        };
    }
    
    // Check if element is in viewport
    static isInViewport(element, threshold = 0) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top >= -threshold &&
            rect.left >= -threshold &&
            rect.bottom <= windowHeight + threshold &&
            rect.right <= windowWidth + threshold
        );
    }
    
    // Scroll element into view smoothly
    static scrollIntoView(element, options = {}) {
        if (!element) return;
        
        const defaultOptions = {
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        };
        
        element.scrollIntoView({ ...defaultOptions, ...options });
    }
    
    // Animate element
    static animate(element, keyframes, options = {}) {
        if (!element || !element.animate) return null;
        
        const defaultOptions = {
            duration: 300,
            easing: 'ease',
            fill: 'forwards'
        };
        
        return element.animate(keyframes, { ...defaultOptions, ...options });
    }
    
    // Fade in element
    static fadeIn(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            const animation = this.animate(element, [
                { opacity: 0 },
                { opacity: 1 }
            ], { duration });
            
            if (animation) {
                animation.onfinish = () => {
                    element.style.opacity = '';
                    resolve();
                };
            } else {
                element.style.opacity = '1';
                resolve();
            }
        });
    }
    
    // Fade out element
    static fadeOut(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        return new Promise(resolve => {
            const animation = this.animate(element, [
                { opacity: 1 },
                { opacity: 0 }
            ], { duration });
            
            if (animation) {
                animation.onfinish = () => {
                    element.style.display = 'none';
                    element.style.opacity = '';
                    resolve();
                };
            } else {
                element.style.display = 'none';
                resolve();
            }
        });
    }
    
    // Slide down element
    static slideDown(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        return new Promise(resolve => {
            const height = element.scrollHeight;
            element.style.height = '0';
            element.style.overflow = 'hidden';
            element.style.display = 'block';
            
            const animation = this.animate(element, [
                { height: '0px' },
                { height: `${height}px` }
            ], { duration });
            
            if (animation) {
                animation.onfinish = () => {
                    element.style.height = '';
                    element.style.overflow = '';
                    resolve();
                };
            } else {
                element.style.height = '';
                element.style.overflow = '';
                resolve();
            }
        });
    }
    
    // Slide up element
    static slideUp(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        return new Promise(resolve => {
            const height = element.scrollHeight;
            element.style.height = `${height}px`;
            element.style.overflow = 'hidden';
            
            const animation = this.animate(element, [
                { height: `${height}px` },
                { height: '0px' }
            ], { duration });
            
            if (animation) {
                animation.onfinish = () => {
                    element.style.display = 'none';
                    element.style.height = '';
                    element.style.overflow = '';
                    resolve();
                };
            } else {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
                resolve();
            }
        });
    }
    
    // Get form data as object
    static getFormData(form) {
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes, etc.)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    // Set form data from object
    static setFormData(form, data) {
        if (!form || !data) return;
        
        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = Boolean(data[key]);
                } else if (input.type === 'radio') {
                    const radio = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                    if (radio) radio.checked = true;
                } else {
                    input.value = data[key];
                }
            }
        });
    }
    
    // Validate form
    static validateForm(form) {
        if (!form) return { isValid: true, errors: [] };
        
        const errors = [];
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                errors.push({
                    field: input.name || input.id,
                    message: `${input.placeholder || input.name || 'Field'} is required`
                });
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    // Debounce function
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }
    
    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Wait for element to exist
    static waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }
    
    // Copy text to clipboard
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            return true;
        } catch (error) {
            console.error('Failed to copy text:', error);
            return false;
        }
    }
    
    // Generate unique ID
    static generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Format currency
    static formatCurrency(amount, currency = '฿') {
        const formatted = parseFloat(amount).toLocaleString('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${formatted} ${currency}`;
    }
    
    // Format date
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return new Date(date).toLocaleDateString('th-TH', { ...defaultOptions, ...options });
    }
    
    // Format time
    static formatTime(date, options = {}) {
        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Date(date).toLocaleTimeString('th-TH', { ...defaultOptions, ...options });
    }
}

// Export utility functions
export const {
    createElement,
    $,
    $$,
    on,
    once,
    delegate,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    getPosition,
    getOffset,
    isInViewport,
    scrollIntoView,
    animate,
    fadeIn,
    fadeOut,
    slideDown,
    slideUp,
    getFormData,
    setFormData,
    validateForm,
    debounce,
    throttle,
    waitForElement,
    copyToClipboard,
    generateId,
    formatCurrency,
    formatDate,
    formatTime
} = DOMUtils;

export default DOMUtils;