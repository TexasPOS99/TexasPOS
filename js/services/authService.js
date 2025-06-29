// Authentication Service
import { CONFIG } from '../config.js';

export class AuthService {
    constructor() {
        this.currentUser = null;
        this.employeeService = null;
        this.sessionKey = 'pos_session';
        this.sessionTimeout = CONFIG.SESSION_TIMEOUT || 8 * 60 * 60 * 1000; // 8 hours default
        
        this.loadSession();
    }
    
    // Set employee service dependency
    setEmployeeService(employeeService) {
        this.employeeService = employeeService;
    }
    
    // Login with PIN
    async loginWithPin(pin) {
        try {
            if (!this.employeeService) {
                throw new Error('Employee service not initialized');
            }
            
            // Validate PIN format
            if (!pin || pin.length !== CONFIG.VALIDATION.PIN_LENGTH || !/^\d+$/.test(pin)) {
                throw new Error('รหัส PIN ไม่ถูกต้อง');
            }
            
            // Get employee by PIN (includes active check)
            const employee = await this.employeeService.getEmployeeByPinForLogin(pin);
            
            // Create session
            this.currentUser = {
                id: employee.id,
                name: employee.name,
                pin: employee.pin,
                role: employee.role,
                loginTime: new Date().toISOString()
            };
            
            // Save session
            this.saveSession();
            
            return this.currentUser;
            
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }
    
    // Logout
    logout() {
        this.currentUser = null;
        this.clearSession();
    }
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }
    
    // Check if user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }
    
    // Check if session is valid
    isSessionValid() {
        if (!this.currentUser || !this.currentUser.loginTime) {
            return false;
        }
        
        const loginTime = new Date(this.currentUser.loginTime);
        const now = new Date();
        const timeDiff = now.getTime() - loginTime.getTime();
        
        return timeDiff < this.sessionTimeout;
    }
    
    // Refresh session
    refreshSession() {
        if (this.currentUser) {
            this.currentUser.loginTime = new Date().toISOString();
            this.saveSession();
        }
    }
    
    // Save session to localStorage
    saveSession() {
        if (this.currentUser) {
            try {
                const sessionData = {
                    user: this.currentUser,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
            } catch (error) {
                console.error('Failed to save session:', error);
            }
        }
    }
    
    // Load session from localStorage
    loadSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                
                // Check if session is still valid
                if (parsed.user && parsed.timestamp) {
                    const sessionTime = new Date(parsed.timestamp);
                    const now = new Date();
                    const timeDiff = now.getTime() - sessionTime.getTime();
                    
                    if (timeDiff < this.sessionTimeout) {
                        this.currentUser = parsed.user;
                        return true;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
        
        // Clear invalid session
        this.clearSession();
        return false;
    }
    
    // Clear session from localStorage
    clearSession() {
        try {
            localStorage.removeItem(this.sessionKey);
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    }
    
    // Auto-logout on session timeout
    startSessionTimer() {
        // Clear existing timer
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        
        // Set new timer
        this.sessionTimer = setTimeout(() => {
            this.logout();
            
            // Redirect to login if not already there
            if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                window.location.href = '/';
            }
        }, this.sessionTimeout);
    }
    
    // Stop session timer
    stopSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }
    
    // Handle user activity (reset session timer)
    handleUserActivity() {
        if (this.isLoggedIn() && this.isSessionValid()) {
            this.refreshSession();
            this.startSessionTimer();
        }
    }
    
    // Initialize activity tracking
    initActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.handleUserActivity();
            }, { passive: true });
        });
    }
    
    // Validate current session
    async validateSession() {
        if (!this.isLoggedIn() || !this.isSessionValid()) {
            this.logout();
            return false;
        }
        
        // Optionally verify with server that user still exists and is active
        if (this.employeeService && this.currentUser) {
            try {
                const employee = await this.employeeService.getEmployee(this.currentUser.id);
                
                if (!employee || !employee.is_active) {
                    this.logout();
                    return false;
                }
                
                // Update user data if needed
                if (employee.name !== this.currentUser.name || employee.role !== this.currentUser.role) {
                    this.currentUser.name = employee.name;
                    this.currentUser.role = employee.role;
                    this.saveSession();
                }
                
            } catch (error) {
                console.error('Session validation failed:', error);
                this.logout();
                return false;
            }
        }
        
        return true;
    }
    
    // Get session info
    getSessionInfo() {
        if (!this.currentUser) {
            return null;
        }
        
        const loginTime = new Date(this.currentUser.loginTime);
        const now = new Date();
        const sessionDuration = now.getTime() - loginTime.getTime();
        const remainingTime = this.sessionTimeout - sessionDuration;
        
        return {
            user: this.currentUser,
            loginTime: loginTime,
            sessionDuration: sessionDuration,
            remainingTime: Math.max(0, remainingTime),
            isValid: this.isSessionValid()
        };
    }
    
    // Change user PIN
    async changePin(currentPin, newPin) {
        try {
            if (!this.currentUser) {
                throw new Error('ไม่พบข้อมูลผู้ใช้');
            }
            
            // Verify current PIN
            if (this.currentUser.pin !== currentPin) {
                throw new Error('รหัส PIN ปัจจุบันไม่ถูกต้อง');
            }
            
            // Validate new PIN
            if (!newPin || newPin.length !== CONFIG.VALIDATION.PIN_LENGTH || !/^\d+$/.test(newPin)) {
                throw new Error('รหัส PIN ใหม่ต้องเป็นตัวเลข 4 หลัก');
            }
            
            if (currentPin === newPin) {
                throw new Error('รหัส PIN ใหม่ต้องแตกต่างจากรหัสเดิม');
            }
            
            // Update PIN via employee service
            if (!this.employeeService) {
                throw new Error('Employee service not initialized');
            }
            
            const updatedEmployee = await this.employeeService.changeEmployeePin(this.currentUser.id, newPin);
            
            // Update current user session
            this.currentUser.pin = newPin;
            this.saveSession();
            
            return updatedEmployee;
            
        } catch (error) {
            console.error('Failed to change PIN:', error);
            throw error;
        }
    }
    
    // Initialize auth service
    init() {
        // Start session timer if logged in
        if (this.isLoggedIn()) {
            this.startSessionTimer();
        }
        
        // Initialize activity tracking
        this.initActivityTracking();
        
        // Validate session on page load
        this.validateSession();
    }
    
    // Cleanup
    destroy() {
        this.stopSessionTimer();
        this.clearSession();
    }
}

// Create and export singleton instance
export const authService = new AuthService();

export default AuthService;