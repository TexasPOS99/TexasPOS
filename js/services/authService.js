// Authentication Service
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config.js';

export class AuthService {
    constructor() {
        this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        this.currentUser = null;
        this.sessionKey = CONFIG.STORAGE_KEYS.USER_SESSION;
    }
    
    // Login with PIN
    async loginWithPin(pin) {
        try {
            if (!pin || pin.length !== CONFIG.VALIDATION.PIN_LENGTH) {
                throw new Error('รหัส PIN ต้องมี 4 หลัก');
            }
            
            // Query employee by PIN - use maybeSingle() to handle no results gracefully
            const { data: employee, error } = await this.supabase
                .from('employees')
                .select('*')
                .eq('pin', pin)
                .eq('is_active', true)
                .maybeSingle();
            
            if (error) {
                console.error('Database error:', error);
                throw new Error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            }
            
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
    
    // Get all employees (admin only)
    async getEmployees() {
        try {
            if (!this.isAdmin()) {
                throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลพนักงาน');
            }
            
            const { data, error } = await this.supabase
                .from('employees')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return data || [];
            
        } catch (error) {
            console.error('Failed to get employees:', error);
            throw error;
        }
    }
    
    // Create new employee (admin only)
    async createEmployee(employeeData) {
        try {
            if (!this.isAdmin()) {
                throw new Error('ไม่มีสิทธิ์สร้างพนักงานใหม่');
            }
            
            // Validate input
            if (!employeeData.name || !employeeData.pin || !employeeData.role) {
                throw new Error('ข้อมูลไม่ครบถ้วน');
            }
            
            if (employeeData.pin.length !== CONFIG.VALIDATION.PIN_LENGTH) {
                throw new Error('รหัส PIN ต้องมี 4 หลัก');
            }
            
            // Check if PIN already exists - use maybeSingle() for graceful handling
            const { data: existingEmployee } = await this.supabase
                .from('employees')
                .select('id')
                .eq('pin', employeeData.pin)
                .maybeSingle();
            
            if (existingEmployee) {
                throw new Error('รหัส PIN นี้มีอยู่แล้ว');
            }
            
            // Create employee
            const { data, error } = await this.supabase
                .from('employees')
                .insert([{
                    name: employeeData.name.trim(),
                    pin: employeeData.pin,
                    role: employeeData.role,
                    is_active: true
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to create employee:', error);
            throw error;
        }
    }
    
    // Update employee (admin only)
    async updateEmployee(employeeId, updates) {
        try {
            if (!this.isAdmin()) {
                throw new Error('ไม่มีสิทธิ์แก้ไขข้อมูลพนักงาน');
            }
            
            // Don't allow updating PIN through this method for security
            const allowedUpdates = {
                name: updates.name,
                role: updates.role,
                is_active: updates.is_active
            };
            
            // Remove undefined values
            Object.keys(allowedUpdates).forEach(key => {
                if (allowedUpdates[key] === undefined) {
                    delete allowedUpdates[key];
                }
            });
            
            const { data, error } = await this.supabase
                .from('employees')
                .update(allowedUpdates)
                .eq('id', employeeId)
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to update employee:', error);
            throw error;
        }
    }
    
    // Toggle employee active status (admin only)
    async toggleEmployeeStatus(employeeId) {
        try {
            if (!this.isAdmin()) {
                throw new Error('ไม่มีสิทธิ์เปลี่ยนสถานะพนักงาน');
            }
            
            // Get current status
            const { data: employee, error: fetchError } = await this.supabase
                .from('employees')
                .select('is_active')
                .eq('id', employeeId)
                .single();
            
            if (fetchError) throw fetchError;
            
            // Toggle status
            const { data, error } = await this.supabase
                .from('employees')
                .update({ is_active: !employee.is_active })
                .eq('id', employeeId)
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to toggle employee status:', error);
            throw error;
        }
    }
    
    // Change PIN (self or admin)
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
            
            // Check if new PIN already exists - use maybeSingle() for graceful handling
            const { data: existingEmployee } = await this.supabase
                .from('employees')
                .select('id')
                .eq('pin', newPin)
                .neq('id', employeeId)
                .maybeSingle();
            
            if (existingEmployee) {
                throw new Error('รหัส PIN นี้มีอยู่แล้ว');
            }
            
            // Update PIN
            const { data, error } = await this.supabase
                .from('employees')
                .update({ pin: newPin })
                .eq('id', employeeId)
                .select()
                .single();
            
            if (error) throw error;
            
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