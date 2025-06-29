// Login View
import { AuthService } from '../services/authService.js';
import { EmployeeService } from '../services/employeeService.js';
import { Toast } from '../components/toast.js';
import { Spinner } from '../components/spinner.js';
import { CONFIG } from '../config.js';

export class LoginView {
    constructor() {
        this.employeeService = new EmployeeService();
        this.authService = new AuthService();
        this.authService.setEmployeeService(this.employeeService);
        this.toast = new Toast();
        this.spinner = new Spinner();
        
        this.pin = '';
        this.maxPinLength = CONFIG.VALIDATION.PIN_LENGTH;
        this.isLoggingIn = false;
        
        this.init();
    }
    
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.checkExistingSession();
        this.ensureSystemAccess();
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
        // Add visual feedback for button press
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
                setTimeout(resolve, CONFIG.LOADING_MIN_DURATION)
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
            
            // Show error toast with more specific message
            this.toast.error(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            
            // Clear PIN after error
            setTimeout(() => {
                this.clearPin();
            }, 1000);
        }
    }
    
    checkExistingSession() {
        // Check if user is already logged in
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
            // Redirect to POS if already logged in
            window.location.href = '/pos.html';
        }
    }
    
    // Ensure system access by checking for active admin
    async ensureSystemAccess() {
        try {
            // Ensure at least one admin is active
            await this.employeeService.ensureActiveAdmin();
        } catch (error) {
            console.error('Failed to ensure system access:', error);
            // Don't show error to user as this is a background operation
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
    
    // Handle page visibility change
    handleVisibilityChange() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, pause any timers
                this.clearPin();
            } else {
                // Page is visible again, reset state
                this.clearErrorState();
            }
        });
    }
    
    // Add accessibility features
    addAccessibilityFeatures() {
        // Add ARIA labels
        this.pinDots.forEach((dot, index) => {
            dot.setAttribute('aria-label', `PIN digit ${index + 1}`);
            dot.setAttribute('role', 'status');
        });
        
        this.keypadButtons.forEach(button => {
            const number = button.dataset.number;
            button.setAttribute('aria-label', `Enter digit ${number}`);
        });
        
        if (this.deleteButton) {
            this.deleteButton.setAttribute('aria-label', 'Delete last digit');
        }
        
        // Add keyboard navigation
        this.keypadButtons.forEach((button, index) => {
            button.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % this.keypadButtons.length;
                    this.keypadButtons[nextIndex].focus();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = (index - 1 + this.keypadButtons.length) % this.keypadButtons.length;
                    this.keypadButtons[prevIndex].focus();
                }
            });
        });
    }
    
    // Initialize all features
    initializeFeatures() {
        this.addKeypadFeedback();
        this.handleVisibilityChange();
        this.addAccessibilityFeatures();
    }
    
    // Destroy view
    destroy() {
        // Clean up event listeners
        document.removeEventListener('keydown', this.handleKeyboardInput);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Clear any pending timeouts
        this.clearPin();
        
        // Hide spinner if visible
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