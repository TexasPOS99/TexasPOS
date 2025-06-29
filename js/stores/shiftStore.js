// Shift Store
import { ShiftService } from '../services/shiftService.js';
import { CONFIG } from '../config.js';

export class ShiftStore {
    constructor() {
        this.shiftService = new ShiftService();
        this.currentShift = null;
        this.listeners = new Map();
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Load current shift if user is authenticated
            await this.loadCurrentShift();
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Failed to initialize shift store:', error);
        }
    }
    
    // Load current shift for authenticated user
    async loadCurrentShift() {
        try {
            // Get current user from auth store
            const authStore = await import('./authStore.js');
            const currentUser = authStore.authStore.getCurrentUser();
            
            if (!currentUser) return;
            
            // Get current shift
            const shift = await this.shiftService.getCurrentShift(currentUser.id);
            
            if (shift) {
                this.currentShift = shift;
                this.emit('shiftLoaded', shift);
            }
            
        } catch (error) {
            console.error('Failed to load current shift:', error);
        }
    }
    
    // Start new shift
    async startShift(employeeId, shiftType = null) {
        try {
            const shift = await this.shiftService.startShift(employeeId, shiftType);
            
            this.currentShift = shift;
            
            // Emit events
            this.emit('shiftStarted', shift);
            this.emit('shiftUpdated', shift);
            
            return shift;
            
        } catch (error) {
            this.emit('shiftError', error);
            throw error;
        }
    }
    
    // End current shift
    async endShift(notes = null) {
        try {
            if (!this.currentShift) {
                throw new Error('ไม่มีกะที่เปิดอยู่');
            }
            
            const shift = await this.shiftService.endShift(this.currentShift.id, notes);
            
            this.currentShift = { ...this.currentShift, ...shift };
            
            // Emit events
            this.emit('shiftEnded', this.currentShift);
            this.emit('shiftUpdated', this.currentShift);
            
            return this.currentShift;
            
        } catch (error) {
            this.emit('shiftError', error);
            throw error;
        }
    }
    
    // Get current shift
    getCurrentShift() {
        return this.currentShift;
    }
    
    // Check if shift is active
    isShiftActive() {
        return this.currentShift && !this.currentShift.end_time;
    }
    
    // Get current shift type
    getCurrentShiftType() {
        return this.shiftService.getCurrentShiftType();
    }
    
    // Get shift info
    getShiftInfo(shiftType = null) {
        const type = shiftType || this.getCurrentShiftType();
        return this.shiftService.getShiftInfo(type);
    }
    
    // Update shift totals (called after sales)
    async updateShiftTotals() {
        try {
            if (!this.currentShift) return;
            
            const updatedShift = await this.shiftService.updateShiftTotals(
                this.currentShift.employee_id,
                this.currentShift.shift_date,
                this.currentShift.shift_type
            );
            
            if (updatedShift) {
                this.currentShift = { ...this.currentShift, ...updatedShift };
                this.emit('shiftUpdated', this.currentShift);
            }
            
        } catch (error) {
            console.error('Failed to update shift totals:', error);
        }
    }
    
    // Get shift summary
    async getShiftSummary(shiftId = null) {
        try {
            const targetShiftId = shiftId || (this.currentShift ? this.currentShift.id : null);
            
            if (!targetShiftId) {
                throw new Error('No shift ID provided');
            }
            
            const summary = await this.shiftService.getShiftSummary(targetShiftId);
            
            this.emit('summaryLoaded', summary);
            
            return summary;
            
        } catch (error) {
            this.emit('summaryError', error);
            throw error;
        }
    }
    
    // Get daily shift summary
    async getDailySummary(date = null, employeeId = null) {
        try {
            const summary = await this.shiftService.getDailyShiftSummary(date, employeeId);
            
            this.emit('dailySummaryLoaded', summary);
            
            return summary;
            
        } catch (error) {
            this.emit('summaryError', error);
            throw error;
        }
    }
    
    // Get shift performance comparison
    async getPerformanceComparison(options = {}) {
        try {
            const comparison = await this.shiftService.getShiftPerformanceComparison(options);
            
            this.emit('performanceLoaded', comparison);
            
            return comparison;
            
        } catch (error) {
            this.emit('performanceError', error);
            throw error;
        }
    }
    
    // Get shifts history
    async getShiftsHistory(options = {}) {
        try {
            const shifts = await this.shiftService.getShifts(options);
            
            this.emit('historyLoaded', shifts);
            
            return shifts;
            
        } catch (error) {
            this.emit('historyError', error);
            throw error;
        }
    }
    
    // Check if shift should be started automatically
    shouldAutoStartShift() {
        // Auto-start shift if:
        // 1. No current shift
        // 2. Current time is within working hours
        // 3. User preference allows auto-start
        
        if (this.currentShift) return false;
        
        const now = new Date();
        const hour = now.getHours();
        
        // Check if within working hours (6 AM to 11 PM)
        return hour >= 6 && hour < 23;
    }
    
    // Get shift duration
    getShiftDuration(shift = null) {
        const targetShift = shift || this.currentShift;
        if (!targetShift || !targetShift.start_time) return 0;
        
        const startTime = new Date(`${targetShift.shift_date}T${targetShift.start_time}`);
        const endTime = targetShift.end_time 
            ? new Date(`${targetShift.shift_date}T${targetShift.end_time}`)
            : new Date();
        
        let duration = endTime.getTime() - startTime.getTime();
        
        // Handle overnight shifts
        if (duration < 0) {
            duration += 24 * 60 * 60 * 1000;
        }
        
        return duration; // in milliseconds
    }
    
    // Format shift duration
    formatShiftDuration(shift = null) {
        const duration = this.getShiftDuration(shift);
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours} ชั่วโมง ${minutes} นาที`;
    }
    
    // Get shift status
    getShiftStatus(shift = null) {
        const targetShift = shift || this.currentShift;
        
        if (!targetShift) return 'no_shift';
        if (!targetShift.end_time) return 'active';
        return 'completed';
    }
    
    // Get shift statistics
    getShiftStats(shift = null) {
        const targetShift = shift || this.currentShift;
        
        if (!targetShift) {
            return {
                totalSales: 0,
                totalOrders: 0,
                averageOrderValue: 0,
                duration: 0,
                salesPerHour: 0
            };
        }
        
        const totalSales = parseFloat(targetShift.total_sales || 0);
        const totalOrders = parseInt(targetShift.total_orders || 0);
        const duration = this.getShiftDuration(targetShift);
        const durationHours = duration / (1000 * 60 * 60);
        
        return {
            totalSales,
            totalOrders,
            averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
            duration,
            salesPerHour: durationHours > 0 ? totalSales / durationHours : 0,
            ordersPerHour: durationHours > 0 ? totalOrders / durationHours : 0
        };
    }
    
    // Refresh current shift data
    async refreshCurrentShift() {
        try {
            if (!this.currentShift) return;
            
            const authStore = await import('./authStore.js');
            const currentUser = authStore.authStore.getCurrentUser();
            
            if (!currentUser) return;
            
            const shift = await this.shiftService.getCurrentShift(currentUser.id);
            
            if (shift) {
                this.currentShift = shift;
                this.emit('shiftRefreshed', shift);
                this.emit('shiftUpdated', shift);
            }
            
        } catch (error) {
            console.error('Failed to refresh current shift:', error);
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
                    console.error(`Error in shift store event callback for ${event}:`, error);
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
        this.currentShift = null;
        this.isInitialized = false;
    }
}

// Create and export singleton instance
export const shiftStore = new ShiftStore();

export default ShiftStore;