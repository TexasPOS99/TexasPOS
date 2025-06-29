// Login View - Enhanced for mobile touch
import { AuthService } from '../services/authService.js';
import { Toast } from '../components/toast.js';
import { Spinner } from '../components/spinner.js';

export class LoginView {
    constructor() {
        this.authService = new AuthService();
        this.toast = new Toast();
        this.spinner = new Spinner();
        
        this.pin = '';
        this.maxPinLength = 4;
        this.isLoggingIn = false;
        
        this.init();
    }
    
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.checkExistingSession();
        this.initializeFeatures();
    }
    
    setupElements() {
        this.pinDots = document.querySelectorAll('.pin-dot');
        this.keypadButtons = document.querySelectorAll('.keypad-btn[data-number]');
        this.deleteButton = document.getElementById('deleteBtn');
    }
    
    setupEventListeners() {
        // Enhanced keypad button handling for mobile
        this.keypadButtons.forEach(button => {
            // Mouse events
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const number = button.dataset.number;
                this.addDigit(number);
            });
            
            // Touch events for better mobile experience
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                button.classList.add('touching');
            }, { passive: false });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                button.classList.remove('touching');
                
                const number = button.dataset.number;
                this.addDigit(number);
            }, { passive: false });
            
            button.addEventListener('touchcancel', (e) => {
                button.classList.remove('touching');
            });
            
            // Prevent context menu on long press
            button.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        });
        
        // Enhanced delete button handling
        if (this.deleteButton) {
            this.deleteButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeDigit();
            });
            
            this.deleteButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.deleteButton.classList.add('touching');
            }, { passive: false });
            
            this.deleteButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.deleteButton.classList.remove('touching');
                this.removeDigit();
            }, { passive: false });
            
            this.deleteButton.addEventListener('touchcancel', (e) => {
                this.deleteButton.classList.remove('touching');
            });
            
            this.deleteButton.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }
        
        // Keyboard input (for desktop)
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });
        
        // Prevent form submission
        document.addEventListener('submit', (e) => {
            e.preventDefault();
        });
        
        // Prevent zoom on double tap
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    handleKeyboardInput(e) {
        if (this.isLoggingIn) return;
        
        // Number keys (0-9)
        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            this.addDigit(e.key);
        }
        // Backspace or Delete
        else if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            this.removeDigit();
        }
        // Enter key
        else if (e.key === 'Enter' && this.pin.length === this.maxPinLength) {
            e.preventDefault();
            this.attemptLogin();
        }
        // Escape key - clear PIN
        else if (e.key === 'Escape') {
            e.preventDefault();
            this.clearPin();
        }
    }
    
    addDigit(digit) {
        if (this.isLoggingIn || this.pin.length >= this.maxPinLength) {
            return;
        }
        
        this.pin += digit;
        this.updatePinDisplay();
        this.addRippleEffect();
        this.provideFeedback();
        
        // Auto-login when PIN is complete
        if (this.pin.length === this.maxPinLength) {
            setTimeout(() => {
                this.attemptLogin();
            }, 200);
        }
    }
    
    removeDigit() {
        if (this.isLoggingIn || this.pin.length === 0) {
            return;
        }
        
        this.pin = this.pin.slice(0, -1);
        this.updatePinDisplay();
        this.provideFeedback();
    }
    
    clearPin() {
        if (this.isLoggingIn) return;
        
        this.pin = '';
        this.updatePinDisplay();
        this.clearErrorState();
    }
    
    updatePinDisplay() {
        this.pinDots.forEach((dot, index) => {
            dot.classList.remove('filled', 'error');
            
            if (index < this.pin.length) {
                dot.classList.add('filled');
            }
        });
    }
    
    addRippleEffect() {
        const lastFilledDot = document.querySelector('.pin-dot.filled:last-of-type');
        if (lastFilledDot) {
            lastFilledDot.style.transform = 'scale(1.1)';
            setTimeout(() => {
                lastFilledDot.style.transform = '';
            }, 150);
        }
    }
    
    provideFeedback() {
        // Haptic feedback for mobile devices
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        
        // Audio feedback (optional)
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Audio feedback not available, continue silently
        }
    }
    
    showErrorState() {
        this.pinDots.forEach(dot => {
            dot.classList.add('error');
        });
        
        // Shake animation
        const pinDisplay = document.querySelector('.pin-display');
        if (pinDisplay) {
            pinDisplay.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                pinDisplay.style.animation = '';
            }, 500);
        }
        
        // Error haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    }
    
    clearErrorState() {
        this.pinDots.forEach(dot => {
            dot.classList.remove('error');
        });
    }
    
    async attemptLogin() {
        if (this.isLoggingIn || this.pin.length !== this.maxPinLength) {
            return;
        }
        
        this.isLoggingIn = true;
        
        try {
            // Show loading spinner
            this.spinner.show('กำลังตรวจสอบรหัส PIN...', true);
            
            // Simulate minimum loading time for better UX
            const loginPromise = this.authService.loginWithPin(this.pin);
            const minLoadingPromise = new Promise(resolve => 
                setTimeout(resolve, 1000)
            );
            
            // Update progress
            this.spinner.setProgress(30, 'กำลังตรวจสอบข้อมูล...');
            
            await Promise.all([loginPromise, minLoadingPromise]);
            
            this.spinner.setProgress(70, 'กำลังเข้าสู่ระบบ...');
            
            // Small delay for progress animation
            await new Promise(resolve => setTimeout(resolve, 300));
            
            this.spinner.setProgress(100, 'เข้าสู่ระบบสำเร็จ!');
            
            // Success haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 50, 50]);
            }
            
            // Wait a bit before redirect
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Redirect to POS
            window.location.href = '/pos.html';
            
        } catch (error) {
            console.error('Login failed:', error);
            
            this.spinner.hide();
            this.isLoggingIn = false;
            
            // Show error state
            this.showErrorState();
            
            // Show error toast
            this.toast.error(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            
            // Clear PIN after error
            setTimeout(() => {
                this.clearPin();
            }, 1000);
        }
    }
    
    checkExistingSession() {
        // Check if user is already logged in
        if (this.authService.isLoggedIn()) {
            // Redirect to POS if already logged in
            window.location.href = '/pos.html';
        }
    }
    
    // Add visual feedback for keypad buttons
    addKeypadFeedback() {
        this.keypadButtons.forEach(button => {
            // Enhanced touch feedback
            button.addEventListener('touchstart', (e) => {
                button.style.transform = 'scale(0.95)';
                button.style.background = 'var(--accent-primary)';
                button.style.color = 'var(--bg-primary)';
            }, { passive: true });
            
            button.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    button.style.transform = '';
                    button.style.background = '';
                    button.style.color = '';
                }, 100);
            }, { passive: true });
            
            button.addEventListener('touchcancel', (e) => {
                button.style.transform = '';
                button.style.background = '';
                button.style.color = '';
            }, { passive: true });
            
            // Mouse feedback for desktop
            button.addEventListener('mousedown', () => {
                button.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('mouseup', () => {
                button.style.transform = '';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = '';
            });
        });
        
        // Delete button feedback
        if (this.deleteButton) {
            this.deleteButton.addEventListener('touchstart', (e) => {
                this.deleteButton.style.transform = 'scale(0.95)';
                this.deleteButton.style.background = 'var(--error)';
                this.deleteButton.style.color = 'white';
            }, { passive: true });
            
            this.deleteButton.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    this.deleteButton.style.transform = '';
                    this.deleteButton.style.background = '';
                    this.deleteButton.style.color = '';
                }, 100);
            }, { passive: true });
            
            this.deleteButton.addEventListener('touchcancel', (e) => {
                this.deleteButton.style.transform = '';
                this.deleteButton.style.background = '';
                this.deleteButton.style.color = '';
            }, { passive: true });
            
            this.deleteButton.addEventListener('mousedown', () => {
                this.deleteButton.style.transform = 'scale(0.95)';
            });
            
            this.deleteButton.addEventListener('mouseup', () => {
                this.deleteButton.style.transform = '';
            });
            
            this.deleteButton.addEventListener('mouseleave', () => {
                this.deleteButton.style.transform = '';
            });
        }
    }
    
    // Prevent viewport zoom on mobile
    preventZoom() {
        // Add viewport meta tag if not present
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        
        // Prevent pinch zoom
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        });
    }
    
    // Initialize all features
    initializeFeatures() {
        this.addKeypadFeedback();
        this.preventZoom();
        
        // Add CSS class for touch devices
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            document.body.classList.add('touch-device');
        }
    }
    
    // Destroy view
    destroy() {
        this.clearPin();
        this.spinner.hide();
    }
}

// Initialize login view when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginView = new LoginView();
    
    // Make globally available for debugging
    if (window.CONFIG && window.CONFIG.DEBUG) {
        window.loginView = loginView;
    }
});

export default LoginView;