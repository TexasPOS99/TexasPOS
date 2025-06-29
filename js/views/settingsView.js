// Settings View (Shift Summary)
import { ShiftService } from '../services/shiftService.js';
import { SalesService } from '../services/salesService.js';
import { AuthService } from '../services/authService.js';
import { TimeUtils } from '../utils/timeUtils.js';
import { CONFIG } from '../config.js';

export class SettingsView {
    constructor(shiftStore, toast) {
        this.shiftService = new ShiftService();
        this.salesService = new SalesService();
        this.authService = new AuthService();
        this.shiftStore = shiftStore;
        this.toast = toast;
        
        this.currentShift = null;
        this.shiftSummary = null;
        this.isLoading = false;
        
        this.elements = {};
    }
    
    async init() {
        this.setupElements();
        this.setupEventListeners();
        await this.loadShiftData();
    }
    
    setupElements() {
        this.elements = {
            totalSales: document.getElementById('totalSales'),
            cashSales: document.getElementById('cashSales'),
            transferSales: document.getElementById('transferSales'),
            totalOrders: document.getElementById('totalOrders')
        };
    }
    
    setupEventListeners() {
        // Shift store events
        this.shiftStore.on('shiftUpdated', (shift) => {
            this.currentShift = shift;
            this.updateSummaryCards();
        });
        
        this.shiftStore.on('shiftStarted', (shift) => {
            this.currentShift = shift;
            this.toast.success('เริ่มกะการทำงานแล้ว');
            this.updateSummaryCards();
        });
        
        this.shiftStore.on('shiftEnded', (shift) => {
            this.currentShift = shift;
            this.toast.success('จบกะการทำงานแล้ว');
            this.updateSummaryCards();
        });
    }
    
    async loadShiftData() {
        try {
            this.showLoading();
            
            // Get current shift from store
            this.currentShift = this.shiftStore.getCurrentShift();
            
            if (!this.currentShift) {
                // Try to start a new shift if none exists
                const currentUser = this.authService.getCurrentUser();
                if (currentUser && this.shiftStore.shouldAutoStartShift()) {
                    try {
                        this.currentShift = await this.shiftStore.startShift(currentUser.id);
                    } catch (error) {
                        console.log('Could not auto-start shift:', error.message);
                    }
                }
            }
            
            // Load shift summary
            if (this.currentShift) {
                await this.loadShiftSummary();
            } else {
                // Load today's summary even without active shift
                await this.loadDailySummary();
            }
            
            this.updateSummaryCards();
            
        } catch (error) {
            console.error('Failed to load shift data:', error);
            this.toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลกะ');
        } finally {
            this.hideLoading();
        }
    }
    
    async loadShiftSummary() {
        try {
            if (!this.currentShift) return;
            
            this.shiftSummary = await this.shiftService.getShiftSummary(this.currentShift.id);
            
        } catch (error) {
            console.error('Failed to load shift summary:', error);
            // Fallback to basic shift data
            this.shiftSummary = {
                shift: this.currentShift,
                totalSales: this.currentShift.total_sales || 0,
                cashSales: this.currentShift.cash_sales || 0,
                transferSales: this.currentShift.transfer_sales || 0,
                totalOrders: this.currentShift.total_orders || 0
            };
        }
    }
    
    async loadDailySummary() {
        try {
            const currentUser = this.authService.getCurrentUser();
            const today = TimeUtils.formatDateForInput(new Date());
            
            const dailySummary = await this.shiftService.getDailyShiftSummary(
                today,
                currentUser ? currentUser.id : null
            );
            
            // Create a summary object compatible with shift summary
            this.shiftSummary = {
                shift: null,
                totalSales: dailySummary.totalSales || 0,
                cashSales: dailySummary.totalCash || 0,
                transferSales: dailySummary.totalTransfer || 0,
                totalOrders: dailySummary.totalOrders || 0
            };
            
        } catch (error) {
            console.error('Failed to load daily summary:', error);
            // Fallback to zero values
            this.shiftSummary = {
                shift: null,
                totalSales: 0,
                cashSales: 0,
                transferSales: 0,
                totalOrders: 0
            };
        }
    }
    
    updateSummaryCards() {
        if (!this.shiftSummary) return;
        
        // Update summary cards
        if (this.elements.totalSales) {
            this.elements.totalSales.textContent = this.formatCurrency(this.shiftSummary.totalSales);
        }
        
        if (this.elements.cashSales) {
            this.elements.cashSales.textContent = this.formatCurrency(this.shiftSummary.cashSales);
        }
        
        if (this.elements.transferSales) {
            this.elements.transferSales.textContent = this.formatCurrency(this.shiftSummary.transferSales);
        }
        
        if (this.elements.totalOrders) {
            this.elements.totalOrders.textContent = this.shiftSummary.totalOrders.toString();
        }
        
        // Add animation to updated values
        this.animateValueUpdate();
    }
    
    animateValueUpdate() {
        const cards = document.querySelectorAll('.summary-card .amount');
        cards.forEach(card => {
            card.style.transform = 'scale(1.05)';
            card.style.transition = 'transform 0.3s ease';
            
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 300);
        });
    }
    
    async startShift() {
        try {
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) {
                this.toast.error('ไม่พบข้อมูลผู้ใช้');
                return;
            }
            
            if (this.currentShift && !this.currentShift.end_time) {
                this.toast.warning('มีกะที่เปิดอยู่แล้ว');
                return;
            }
            
            const loadingToast = this.toast.loading('กำลังเริ่มกะการทำงาน...');
            
            this.currentShift = await this.shiftStore.startShift(currentUser.id);
            
            loadingToast.success('เริ่มกะการทำงานสำเร็จ!');
            
            await this.loadShiftSummary();
            this.updateSummaryCards();
            
        } catch (error) {
            console.error('Failed to start shift:', error);
            this.toast.error(error.message || 'เกิดข้อผิดพลาดในการเริ่มกะ');
        }
    }
    
    async endShift() {
        try {
            if (!this.currentShift || this.currentShift.end_time) {
                this.toast.warning('ไม่มีกะที่เปิดอยู่');
                return;
            }
            
            const confirmed = await this.modal.confirm(
                'จบกะการทำงาน',
                'คุณต้องการจบกะการทำงานหรือไม่?'
            );
            
            if (!confirmed) return;
            
            const notes = await this.modal.prompt(
                'หมายเหตุ',
                'หมายเหตุสำหรับกะนี้ (ไม่บังคับ)',
                '',
                { placeholder: 'เช่น สรุปการทำงาน, ปัญหาที่พบ, ฯลฯ' }
            );
            
            const loadingToast = this.toast.loading('กำลังจบกะการทำงาน...');
            
            this.currentShift = await this.shiftStore.endShift(notes);
            
            loadingToast.success('จบกะการทำงานสำเร็จ!');
            
            await this.loadShiftSummary();
            this.updateSummaryCards();
            
        } catch (error) {
            console.error('Failed to end shift:', error);
            this.toast.error(error.message || 'เกิดข้อผิดพลาดในการจบกะ');
        }
    }
    
    getShiftStatus() {
        if (!this.currentShift) {
            return {
                status: 'no_shift',
                text: 'ยังไม่ได้เ��ิ่มกะ',
                class: 'no-shift'
            };
        }
        
        if (this.currentShift.end_time) {
            return {
                status: 'ended',
                text: 'จบกะแล้ว',
                class: 'ended'
            };
        }
        
        return {
            status: 'active',
            text: 'กำลังทำงาน',
            class: 'active'
        };
    }
    
    getShiftDuration() {
        if (!this.currentShift || !this.currentShift.start_time) {
            return '0 ชั่วโมง 0 นาที';
        }
        
        const startTime = new Date(`${this.currentShift.shift_date}T${this.currentShift.start_time}`);
        const endTime = this.currentShift.end_time 
            ? new Date(`${this.currentShift.shift_date}T${this.currentShift.end_time}`)
            : new Date();
        
        const duration = TimeUtils.calculateDuration(startTime, endTime);
        return TimeUtils.formatDuration(duration);
    }
    
    getCurrentShiftInfo() {
        if (!this.currentShift) return null;
        
        const shiftType = this.currentShift.shift_type;
        const shiftInfo = TimeUtils.getShiftTimeRange(shiftType);
        
        return {
            type: shiftType,
            name: TimeUtils.getShiftName(shiftType),
            timeRange: shiftInfo ? `${shiftInfo.start} - ${shiftInfo.end}` : '',
            date: TimeUtils.formatDate(this.currentShift.shift_date),
            duration: this.getShiftDuration(),
            status: this.getShiftStatus()
        };
    }
    
    async refreshData() {
        try {
            // Refresh shift data from store
            await this.shiftStore.refreshCurrentShift();
            
            // Reload summary
            await this.loadShiftData();
            
            this.toast.success('รีเฟรชข้อมูลแล้ว');
            
        } catch (error) {
            console.error('Failed to refresh data:', error);
            this.toast.error('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล');
        }
    }
    
    showLoading() {
        // Show loading state on summary cards
        const amounts = document.querySelectorAll('.summary-card .amount');
        amounts.forEach(amount => {
            amount.textContent = '...';
        });
        
        this.isLoading = true;
    }
    
    hideLoading() {
        this.isLoading = false;
    }
    
    formatCurrency(amount) {
        return parseFloat(amount || 0).toLocaleString('th-TH', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }) + ' ฿';
    }
    
    async activate() {
        // Refresh data when view becomes active
        if (!this.isLoading) {
            await this.loadShiftData();
        }
    }
    
    async deactivate() {
        // Clean up when view becomes inactive
        // Nothing specific to clean up for this view
    }
}

export default SettingsView;