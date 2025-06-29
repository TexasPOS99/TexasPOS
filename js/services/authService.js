// Authentication Service
import { CONFIG } from '../config.js';

export class AuthService {
    constructor() {
        this.currentUser = null;
        this.sessionKey = CONFIG.STORAGE_KEYS.USER_SESSION;
        this.employeeService = null; // Will be injected
    }
    
    // Set employee service dependency
    setEmployeeService(employeeService) {
        this.employeeService = employeeService;
    }
    
    // Login with PIN
    async loginWithPin(pin) {
        try {
            if (!pin || pin.length !== CONFIG.VALIDATION.PIN_LENGTH) {
                throw new Error('รหัส PIN ต้องมี 4 หลัก');
            }
            
            if (!this.employeeService) {
                throw new Error('EmployeeService not initialized');
            }
            
            // Get employee by PIN using EmployeeService
            const employee = await this.employeeService.getEmployeeByPin(pin);
            
            if (!employee) {
                throw new Error('รหัส PIN ไม่ถูกต้องหรือบัญชีถูกปิดใช้งาน');
            }
            
            // Create session
            const session = {
                id: employee.id,
                name: employee.name,
                role: employee.role,
                pin: employee.pin,
                loginTime: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            };
            
            // Save session
            this.currentUser = session;
            this.saveSession(session);
            
            return session;
            
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }
    
    // Get current user from session
    getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }
        
        // Try to load from localStorage
        const savedSession = this.loadSession();
        if (savedSession && this.isSessionValid(savedSession)) {
            this.currentUser = savedSession;
            return savedSession;
        }
        
        return null;
    }
    
    // Check if user is authenticated
    isAuthenticated() {
        const user = this.getCurrentUser();
        return user !== null;
    }
    
    // Check if user is admin
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
    
    // Logout
    async logout() {
        try {
            // Clear current user
            this.currentUser = null;
            
            // Clear session storage
            this.clearSession();
            
            return true;
            
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    }
    
    // Update last activity
    updateLastActivity() {
        if (this.currentUser) {
            this.currentUser.lastActivity = new Date().toISOString();
            this.saveSession(this.currentUser);
        }
    }
    
    // Check if session is valid
    isSessionValid(session) {
        if (!session || !session.loginTime) {
            return false;
        }
        
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const timeDiff = now.getTime() - loginTime.getTime();
        
        // Check if session has expired (default: 8 hours)
        const maxSessionTime = CONFIG.AUTO_LOGOUT_TIME || 8 * 60 * 60 * 1000;
        
        return timeDiff < maxSessionTime;
    }
    
    // Save session to localStorage
    saveSession(session) {
        try {
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }
    
    // Load session from localStorage
    loadSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error('Failed to load session:', error);
            return null;
        }
    }
    
    // Clear session from localStorage
    clearSession() {
        try {
            localStorage.removeItem(this.sessionKey);
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    }
    
    // Get all employees (admin only) - delegate to EmployeeService
    async getEmployees() {
        try {
            if (!this.isAdmin()) {
                throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลพนักงาน');
            }
            
            if (!this.employeeService) {
                throw new Error('EmployeeService not initialized');
            }
            
            return await this.employeeService.getEmployees();
            
        } catch (error) {
            console.error('Failed to get employees:', error);
            throw error;
        }
    }
    
    // Create new employee (admin only) - delegate to EmployeeService
    async createEmployee(employeeData) {
        try {
            if (!this.isAdmin()) {
                throw new Error('ไม่มีสิทธิ์สร้างพนักงานใหม่');
            }
            
            if (!this.employeeService) {
                throw new Error('EmployeeService not initialized');
            }
            
            return await this.employeeService.createEmployee(employeeData);
            
        } catch (error) {
            console.error('Failed to create employee:', error);
            throw error;
        }
    }
    
    // Update employee (admin only) - delegate to EmployeeService
    async updateEmployee(employeeId, updates) {
        try {
            if (!this.isAdmin()) {
                throw new Error('ไม่มีสิทธิ์แก้ไขข้อมูลพนักงาน');
            }
            
            if (!this.employeeService) {
                throw new Error('EmployeeService not initialized');
            }
            
            return await this.employeeService.updateEmployee(employeeId, updates);
            
        } catch (error) {
            console.error('Failed to update employee:', error);
            throw error;
        }
    }
    
    // Toggle employee active status (admin only) - delegate to EmployeeService
    async toggleEmployeeStatus(employeeId) {
        try {
            if (!this.isAdmin()) {
                throw new Error('ไม่มีสิทธิ์เปลี่ยนสถานะพนักงาน');
            }
            
            if (!this.employeeService) {
                throw new Error('EmployeeService not initialized');
            }
            
            return await this.employeeService.toggleEmployeeStatus(employeeId);
            
        } catch (error) {
            console.error('Failed to toggle employee status:', error);
            throw error;
        }
    }
    
    // Change PIN (self or admin) - delegate to EmployeeService
    async changePin(employeeId, newPin, currentPin = null) {
        try {
            const currentUser = this.getCurrentUser();
            
            // Check permissions
            if (currentUser.id !== employeeId && !this.isAdmin()) {
                throw new Error('ไม่มีสิทธิ์เปลี่ยนรหัส PIN');
            }
            
            // Validate new PIN
            if (!newPin || newPin.length !== CONFIG.VALIDATION.PIN_LENGTH) {
                throw new Error('รหัส PIN ใหม่ต้องมี 4 หลัก');
            }
            
            // If changing own PIN, verify current PIN
            if (currentUser.id === employeeId && currentPin) {
                if (currentPin !== currentUser.pin) {
                    throw new Error('รหัส PIN ปัจจุบันไม่ถูกต้อง');
                }
            }
            
            if (!this.employeeService) {
                throw new Error('EmployeeService not initialized');
            }
            
            const data = await this.employeeService.changePin(employeeId, newPin, currentPin);
            
            // If changing own PIN, update session
            if (currentUser.id === employeeId) {
                currentUser.pin = newPin;
                this.saveSession(currentUser);
            }
            
            return data;
            
        } catch (error) {
            console.error('Failed to change PIN:', error);
            throw error;
        }
    }
    
    // Auto-logout on inactivity
    setupAutoLogout() {
        let inactivityTimer;
        
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            this.updateLastActivity();
            
            inactivityTimer = setTimeout(() => {
                this.logout();
                window.location.href = '/';
            }, CONFIG.AUTO_LOGOUT_TIME);
        };
        
        // Events that reset the timer
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        // Initial timer setup
        resetTimer();
    }
}

// Create and export singleton instance
export const authService = new AuthService();

export default AuthService;