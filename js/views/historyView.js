// History View
import { SalesService } from '../services/salesService.js';
import { AuthService } from '../services/authService.js';
import { TimeUtils } from '../utils/timeUtils.js';
import { CONFIG } from '../config.js';

export class HistoryView {
    constructor(toast) {
        this.salesService = new SalesService();
        this.authService = new AuthService();
        this.toast = toast;
        
        this.sales = [];
        this.filters = {
            date: null,
            shiftType: '',
            employeeId: null
        };
        this.isLoading = false;
        this.expandedItems = new Set();
        
        this.elements = {};
    }
    
    async init() {
        this.setupElements();
        this.setupEventListeners();
        await this.loadSales();
    }
    
    setupElements() {
        this.elements = {
            historyList: document.getElementById('historyList'),
            historyDate: document.getElementById('historyDate'),
            historyShift: document.getElementById('historyShift'),
            searchHistory: document.getElementById('searchHistory')
        };
        
        // Set default date to today
        if (this.elements.historyDate) {
            this.elements.historyDate.value = TimeUtils.formatDateForInput(new Date());
            this.filters.date = this.elements.historyDate.value;
        }
    }
    
    setupEventListeners() {
        // Search button
        if (this.elements.searchHistory) {
            this.elements.searchHistory.addEventListener('click', () => {
                this.applyFilters();
            });
        }
        
        // Date filter
        if (this.elements.historyDate) {
            this.elements.historyDate.addEventListener('change', (e) => {
                this.filters.date = e.target.value;
            });
        }
        
        // Shift filter
        if (this.elements.historyShift) {
            this.elements.historyShift.addEventListener('change', (e) => {
                this.filters.shiftType = e.target.value;
            });
        }
        
        // History item clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.history-expand-btn')) {
                this.handleExpandToggle(e.target.closest('.history-expand-btn'));
            }
        });
        
        // Enter key on filters
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.closest('.history-filters')) {
                this.applyFilters();
            }
        });
    }
    
    async loadSales() {
        try {
            this.showLoading();
            
            const options = {
                sortBy: 'created_at',
                sortOrder: 'desc',
                limit: 50
            };
            
            // Apply filters
            if (this.filters.date) {
                options.startDate = this.filters.date;
                options.endDate = this.filters.date;
            }
            
            if (this.filters.shiftType) {
                options.shiftType = this.filters.shiftType;
            }
            
            if (this.filters.employeeId) {
                options.employeeId = this.filters.employeeId;
            }
            
            this.sales = await this.salesService.getSales(options);
            this.renderSales();
            
        } catch (error) {
            console.error('Failed to load sales:', error);
            this.toast.error('เกิดข้อผิดพลาดในการโหลดประวัติการขาย');
        } finally {
            this.hideLoading();
        }
    }
    
    renderSales() {
        if (!this.elements.historyList) return;
        
        if (this.sales.length === 0) {
            this.elements.historyList.innerHTML = this.getEmptyState();
            return;
        }
        
        const salesHtml = this.sales.map(sale => this.createHistoryItem(sale)).join('');
        this.elements.historyList.innerHTML = salesHtml;
    }
    
    createHistoryItem(sale) {
        const isExpanded = this.expandedItems.has(sale.id);
        const expandedClass = isExpanded ? 'expanded' : '';
        
        return `
            <div class="history-item ${expandedClass}" data-sale-id="${sale.id}">
                <div class="history-item-header">
                    <div class="history-item-main">
                        <div class="history-item-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M7 18C5.9 18 5 18.9 5 20S5.9 22 7 22 9 21.1 9 20 8.1 18 7 18ZM1 2V4H3L6.6 11.59L5.24 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L20.88 5H5.21L4.27 3H1ZM17 18C15.9 18 15 18.9 15 20S15.9 22 17 22 19 21.1 19 20 18.1 18 17 18Z"/>
                            </svg>
                        </div>
                        
                        <div class="history-item-info">
                            <h3 class="history-item-number">${sale.sale_number}</h3>
                            <div class="history-item-details">
                                <div class="history-item-detail">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                                    </svg>
                                    ${TimeUtils.formatTime(sale.created_at)}
                                </div>
                                
                                <div class="history-item-detail">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                                    </svg>
                                    ${sale.employee?.name || 'ไม่ระบุ'}
                                </div>
                                
                                <div class="history-item-detail">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                                    </svg>
                                    ${TimeUtils.getShiftName(sale.shift_type)}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="history-item-amount">
                        <h3 class="history-amount">${this.formatCurrency(sale.total_amount)}</h3>
                        <div class="history-payment-method">
                            <span class="payment-method-badge ${sale.payment_method}">
                                ${CONFIG.PAYMENT_METHODS[sale.payment_method] || sale.payment_method}
                            </span>
                        </div>
                    </div>
                    
                    <button class="history-expand-btn" data-sale-id="${sale.id}">
                        <svg viewBox="0 0 24 24">
                            <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                        </svg>
                    </button>
                </div>
                
                <div class="history-item-details-panel">
                    ${this.createSaleDetails(sale)}
                </div>
            </div>
        `;
    }
    
    createSaleDetails(sale) {
        const items = sale.items || [];
        const changeAmount = sale.change_amount || 0;
        
        return `
            <div class="sale-items-list">
                <div class="sale-items-header">
                    <svg viewBox="0 0 24 24">
                        <path d="M19,7H22V9H19V12H17V9H14V7H17V4H19V7M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V20C21,21.1 20.1,22 19,22H5C3.9,22 3,21.1 3,20V9H1V7H5V6C5,4.9 5.9,4 7,4H9.18C9.6,2.84 10.7,2 12,2C13.3,2 14.4,2.84 14.82,4H17C18.1,4 19,4.9 19,6V7H23V9H21M19,9H5V20H19V9Z"/>
                    </svg>
                    รายการสินค้า (${items.length} รายการ)
                </div>
                
                ${items.map(item => `
                    <div class="sale-item">
                        <div class="sale-item-info">
                            <div class="sale-item-name">${item.product_name}</div>
                            <div class="sale-item-details">
                                ${item.price_label} × ${item.quantity} = ${this.formatCurrency(item.subtotal)}
                            </div>
                        </div>
                        <div class="sale-item-total">${this.formatCurrency(item.subtotal)}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="history-summary">
                <div class="summary-item">
                    <div class="summary-label">ยอดรวม</div>
                    <div class="summary-value">${this.formatCurrency(sale.total_amount)}</div>
                </div>
                
                <div class="summary-item">
                    <div class="summary-label">วิธีชำระ</div>
                    <div class="summary-value">${CONFIG.PAYMENT_METHODS[sale.payment_method] || sale.payment_method}</div>
                </div>
                
                ${sale.payment_method === 'cash' ? `
                    <div class="summary-item">
                        <div class="summary-label">เงินที่รับ</div>
                        <div class="summary-value">${this.formatCurrency(sale.cash_received)}</div>
                    </div>
                    
                    ${changeAmount > 0 ? `
                        <div class="summary-item">
                            <div class="summary-label">เงินทอน</div>
                            <div class="summary-value">${this.formatCurrency(changeAmount)}</div>
                        </div>
                    ` : ''}
                ` : ''}
                
                <div class="summary-item">
                    <div class="summary-label">เวลา</div>
                    <div class="summary-value">${TimeUtils.formatDateTime(sale.created_at)}</div>
                </div>
            </div>
        `;
    }
    
    getEmptyState() {
        return `
            <div class="history-empty">
                <div class="history-empty-icon">📋</div>
                <h3>ไม่พบประวัติการขาย</h3>
                <p>ลองเปลี่ยนเงื่อนไขการค้นหา</p>
            </div>
        `;
    }
    
    handleExpandToggle(button) {
        const saleId = parseInt(button.dataset.saleId);
        const historyItem = button.closest('.history-item');
        
        if (!historyItem) return;
        
        if (this.expandedItems.has(saleId)) {
            // Collapse
            this.expandedItems.delete(saleId);
            historyItem.classList.remove('expanded');
        } else {
            // Expand
            this.expandedItems.add(saleId);
            historyItem.classList.add('expanded');
        }
    }
    
    async applyFilters() {
        // Update filters from form
        if (this.elements.historyDate) {
            this.filters.date = this.elements.historyDate.value;
        }
        
        if (this.elements.historyShift) {
            this.filters.shiftType = this.elements.historyShift.value;
        }
        
        // Clear expanded items
        this.expandedItems.clear();
        
        // Reload sales with new filters
        await this.loadSales();
    }
    
    showLoading() {
        if (this.elements.historyList) {
            this.elements.historyList.innerHTML = `
                <div class="history-loading">
                    <div class="ring-spinner"></div>
                    <p>กำลังโหลดประวัติการขาย...</p>
                </div>
            `;
        }
        this.isLoading = true;
    }
    
    hideLoading() {
        this.isLoading = false;
    }
    
    formatCurrency(amount) {
        return parseFloat(amount).toLocaleString('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' ฿';
    }
    
    async activate() {
        // Refresh sales when view becomes active
        if (!this.isLoading) {
            await this.loadSales();
        }
    }
    
    async deactivate() {
        // Clean up when view becomes inactive
        this.expandedItems.clear();
    }
}

export default HistoryView;