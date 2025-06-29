// Authentication Service - Rebuilt from scratch
import { CONFIG } from '../config.js';

export class AuthService {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'texaspos_session';
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
        
        // Load existing session on startup
        this.loadSession();
    }
    
    // Simple PIN-based login
    async loginWithPin(pin) {
        try {
            // Validate PIN format
            if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
                throw new Error('รหัส PIN ต้องเป็นตัวเลข 4 หลัก');
            }
            
            // Check against hardcoded employees first
            const employee = this.findEmployeeByPin(pin);
            
            if (!employee) {
                throw new Error('รหัส PIN ไม่ถูกต้อง');
            }
            
            if (!employee.is_active) {
                throw new Error('บัญชีถูกปิดใช้งาน');
            }
            
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
    
    // Find employee by PIN from hardcoded data
    findEmployeeByPin(pin) {
        const employees = [
            { id: 1, pin: '2483', name: 'เนม', role: 'admin', is_active: true },
            { id: 2, pin: '1516', name: 'ใหม่', role: 'employee', is_active: true },
            { id: 3, pin: '1903', name: 'เฟิส', role: 'employee', is_active: true },
            { id: 4, pin: '2111', name: 'มิก', role: 'employee', is_active: true },
            { id: 5, pin: '0106', name: 'นัท', role: 'employee', is_active: true },
            { id: 6, pin: '1234', name: 'ผู้ดูแลระบบ', role: 'admin', is_active: true }
        ];
        
        return employees.find(emp => emp.pin === pin);
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
        return this.currentUser !== null && this.isSessionValid();
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
    
    // Refresh session timestamp
    refreshSession() {
        if (this.currentUser) {
            this.currentUser.loginTime = new Date().toISOString();
            this.saveSession();
        }
    }
    
    // Get all employees (for admin features)
    getAllEmployees() {
        return [
            { id: 1, pin: '2483', name: 'เนม', role: 'admin', is_active: true },
            { id: 2, pin: '1516', name: 'ใหม่', role: 'employee', is_active: true },
            { id: 3, pin: '1903', name: 'เฟิส', role: 'employee', is_active: true },
            { id: 4, pin: '2111', name: 'มิก', role: 'employee', is_active: true },
            { id: 5, pin: '0106', name: 'นัท', role: 'employee', is_active: true },
            { id: 6, pin: '1234', name: 'ผู้ดูแลระบบ', role: 'admin', is_active: true }
        ];
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
    
    // Initialize auth service
    init() {
        // Auto-refresh session on user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                if (this.isLoggedIn()) {
                    this.refreshSession();
                }
            }, { passive: true });
        });
        
        // Check session validity periodically
        setInterval(() => {
            if (this.currentUser && !this.isSessionValid()) {
                this.logout();
                if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                    window.location.href = '/';
                }
            }
        }, 60000); // Check every minute
    }
}

// Create and export singleton instance
export const authService = new AuthService();

export default AuthService;