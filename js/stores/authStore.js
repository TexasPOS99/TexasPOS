// Authentication Store
import { AuthService } from '../services/authService.js';
import { CONFIG } from '../config.js';

export class AuthStore {
    constructor() {
        this.authService = new AuthService();
        this.currentUser = null;
        this.isAuthenticated = false;
        this.listeners = new Map();
        
        this.init();
    }
    
    async init() {
        // Load current user from session
        this.currentUser = this.authService.getCurrentUser();
        this.isAuthenticated = this.currentUser !== null;
        
        // Setup auto-logout on inactivity
        if (this.isAuthenticated) {
            this.authService.setupAutoLogout();
        }
        
        // Listen for storage changes (multi-tab support)
        window.addEventListener('storage', (e) => {
            if (e.key === CONFIG.STORAGE_KEYS.USER_SESSION) {
                this.handleSessionChange();
            }
        });
    }
    
    // Handle session changes from other tabs
    handleSessionChange() {
        const newUser = this.authService.getCurrentUser();
        const wasAuthenticated = this.isAuthenticated;
        
        this.currentUser = newUser;
        this.isAuthenticated = newUser !== null;
        
        // Emit events based on changes
        if (wasAuthenticated && !this.isAuthenticated) {
            this.emit('logout');
        } else if (!wasAuthenticated && this.isAuthenticated) {
            this.emit('login', newUser);
        } else if (this.isAuthenticated && newUser) {
            this.emit('userUpdated', newUser);
        }
    }
    
    // Login with PIN
    async loginWithPin(pin) {
        try {
            const user = await this.authService.loginWithPin(pin);
            
            this.currentUser = user;
            this.isAuthenticated = true;
            
            // Setup auto-logout
            this.authService.setupAutoLogout();
            
            // Emit login event
            this.emit('login', user);
            
            return user;
            
        } catch (error) {
            this.emit('loginError', error);
            throw error;
        }
    }
    
    // Logout
    async logout() {
        try {
            await this.authService.logout();
            
            const previousUser = this.currentUser;
            this.currentUser = null;
            this.isAuthenticated = false;
            
            // Emit logout event
            this.emit('logout', previousUser);
            
            return true;
            
        } catch (error) {
            this.emit('logoutError', error);
            throw error;
        }
    }
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Check if authenticated
    isUserAuthenticated() {
        return this.isAuthenticated;
    }
    
    // Check if user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }
    
    // Check if user is employee
    isEmployee() {
        return this.currentUser && this.currentUser.role === 'employee';
    }
    
    // Update last activity
    updateActivity() {
        if (this.isAuthenticated) {
            this.authService.updateLastActivity();
            this.emit('activityUpdated');
        }
    }
    
    // Get user permissions
    getUserPermissions() {
        if (!this.currentUser) return [];
        
        const basePermissions = [
            'view_products',
            'create_sales',
            'view_sales_history',
            'view_stock',
            'update_stock'
        ];
        
        const adminPermissions = [
            ...basePermissions,
            'manage_employees',
            'manage_products',
            'manage_categories',
            'manage_prices',
            'view_reports',
            'manage_settings',
            'delete_sales',
            'view_deletion_history'
        ];
        
        return this.isAdmin() ? adminPermissions : basePermissions;
    }
    
    // Check if user has permission
    hasPermission(permission) {
        const permissions = this.getUserPermissions();
        return permissions.includes(permission);
    }
    
    // Require authentication
    requireAuth() {
        if (!this.isAuthenticated) {
            throw new Error('Authentication required');
        }
        return this.currentUser;
    }
    
    // Require admin role
    requireAdmin() {
        this.requireAuth();
        if (!this.isAdmin()) {
            throw new Error('Admin role required');
        }
        return this.currentUser;
    }
    
    // Get session info
    getSessionInfo() {
        if (!this.currentUser) return null;
        
        return {
            user: this.currentUser,
            isAuthenticated: this.isAuthenticated,
            permissions: this.getUserPermissions(),
            loginTime: this.currentUser.loginTime,
            lastActivity: this.currentUser.lastActivity
        };
    }
    
    // Refresh user data
    async refreshUser() {
        if (!this.currentUser) return null;
        
        try {
            // In a real app, you might fetch updated user data from the server
            // For now, we'll just update the last activity
            this.updateActivity();
            
            this.emit('userRefreshed', this.currentUser);
            return this.currentUser;
            
        } catch (error) {
            console.error('Failed to refresh user:', error);
            throw error;
        }
    }
    
    // Event system
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }
    
    // Remove event listener
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    // Emit event
    emit(event, data = null) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in auth store event callback for ${event}:`, error);
                }
            });
        }
    }
    
    // Clear all listeners
    clearListeners() {
        this.listeners.clear();
    }
    
    // Destroy store
    destroy() {
        this.clearListeners();
        this.currentUser = null;
        this.isAuthenticated = false;
    }
}

// Create and export singleton instance
export const authStore = new AuthStore();

export default AuthStore;