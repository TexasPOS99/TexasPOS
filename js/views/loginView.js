// Login View - Simplified
import { AuthService } from '../services/authService.js';
import { Toast } from '../components/toast.js';
import { Spinner } from '../components/spinner.js';
import { CONFIG } from '../config.js';

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
    }
    
    setupElements() {
        this.pinDots = document.querySelectorAll('.pin-dot');
        this.keypadButtons = document.querySelectorAll('.keypad-btn[data-number]');
        this.deleteButton = document.getElementById('deleteBtn');
    }
    
    setupEventListeners() {
        // Keypad button clicks
        this.keypadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const number = button.dataset.number;
                this.addDigit(number);
            });
        });
        
        // Delete button
        if (this.deleteButton) {
            this.deleteButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.removeDigit();
            });
        }
        
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });
        
        // Prevent form submission
        document.addEventListener('submit', (e) => {
            e.preventDefault();
        });
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
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', () => {
                button.style.transform = '';
            });
            
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
            this.deleteButton.addEventListener('touchstart', () => {
                this.deleteButton.style.transform = 'scale(0.95)';
            });
            
            this.deleteButton.addEventListener('touchend', () => {
                this.deleteButton.style.transform = '';
            });
            
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
    
    // Initialize all features
    initializeFeatures() {
        this.addKeypadFeedback();
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
    loginView.initializeFeatures();
    
    // Make globally available for debugging
    if (CONFIG.DEBUG) {
        window.loginView = loginView;
    }
});

export default LoginView;