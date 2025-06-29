// Stock View
import { ProductService } from '../services/productService.js';
import { AuthService } from '../services/authService.js';
import { CONFIG } from '../config.js';

export class StockView {
    constructor(toast, modal) {
        this.productService = new ProductService();
        this.authService = new AuthService();
        this.toast = toast;
        this.modal = modal;
        
        this.products = [];
        this.searchTerm = '';
        this.isLoading = false;
        this.currentProduct = null;
        
        this.elements = {};
    }
    
    async init() {
        this.setupElements();
        this.setupEventListeners();
        await this.loadProducts();
    }
    
    setupElements() {
        this.elements = {
            stockList: document.getElementById('stockList'),
            stockSearch: document.getElementById('stockSearch'),
            stockAdjustmentModal: null // Will be created dynamically
        };
    }
    
    setupEventListeners() {
        // Search functionality
        if (this.elements.stockSearch) {
            this.elements.stockSearch.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.debounceSearch();
            });
        }
        
        // Stock action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.stock-action-btn')) {
                this.handleStockAction(e.target.closest('.stock-action-btn'));
            }
        });
    }
    
    // Debounced search
    debounceSearch = this.debounce(() => {
        this.filterProducts();
    }, 300);
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    async loadProducts() {
        try {
            this.showLoading();
            
            this.products = await this.productService.getProducts({
                activeOnly: false,
                sortBy: 'name',
                sortOrder: 'asc'
            });
            
            this.renderProducts();
            
        } catch (error) {
            console.error('Failed to load products:', error);
            this.toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
        } finally {
            this.hideLoading();
        }
    }
    
    renderProducts() {
        if (!this.elements.stockList) return;
        
        const filteredProducts = this.getFilteredProducts();
        
        if (filteredProducts.length === 0) {
            this.elements.stockList.innerHTML = this.getEmptyState();
            return;
        }
        
        const productsHtml = filteredProducts.map(product => this.createStockItem(product)).join('');
        this.elements.stockList.innerHTML = productsHtml;
    }
    
    getFilteredProducts() {
        if (!this.searchTerm) return this.products;
        
        const term = this.searchTerm.toLowerCase();
        return this.products.filter(product => 
            product.name.toLowerCase().includes(term) ||
            (product.barcode && product.barcode.toLowerCase().includes(term)) ||
            (product.category_name && product.category_name.toLowerCase().includes(term))
        );
    }
    
    createStockItem(product) {
        const stockStatus = this.getStockStatus(product);
        const currentUser = this.authService.getCurrentUser();
        const isAdmin = currentUser && currentUser.role === 'admin';
        
        return `
            <div class="stock-item" data-product-id="${product.id}">
                <div class="stock-item-image">
                    ${product.image_url ? 
                        `<img src="${product.image_url}" alt="${product.name}">` :
                        '<div class="stock-item-image-placeholder">📦</div>'
                    }
                </div>
                
                <div class="stock-item-info">
                    <h3 class="stock-item-name">${product.name}</h3>
                    <p class="stock-item-category">${product.category_name || 'ไม่มีหมวดหมู่'}</p>
                    ${product.barcode ? `<p class="stock-item-barcode">รหัส: ${product.barcode}</p>` : ''}
                </div>
                
                <div class="stock-item-quantity">
                    <div class="stock-current ${stockStatus.class}">${product.stock}</div>
                    <div class="stock-min">ขั้นต่ำ: ${product.min_stock}</div>
                    <div class="stock-status ${stockStatus.class}">${stockStatus.text}</div>
                </div>
                
                <div class="stock-item-actions">
                    <button class="stock-action-btn restock" data-action="restock" data-product-id="${product.id}" title="เติมสต็อก">
                        <svg viewBox="0 0 24 24">
                            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                        </svg>
                    </button>
                    
                    <button class="stock-action-btn edit" data-action="adjust" data-product-id="${product.id}" title="ปรับปรุงสต็อก">
                        <svg viewBox="0 0 24 24">
                            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                        </svg>
                    </button>
                    
                    ${isAdmin ? `
                        <button class="stock-action-btn edit" data-action="edit-product" data-product-id="${product.id}" title="แก้ไขสินค้า">
                            <svg viewBox="0 0 24 24">
                                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    getStockStatus(product) {
        if (product.stock === 0) {
            return { class: 'out', text: 'หมดสต็อก' };
        } else if (product.stock <= product.min_stock) {
            return { class: 'low', text: 'สต็อกต่ำ' };
        } else {
            return { class: 'normal', text: 'ปกติ' };
        }
    }
    
    getEmptyState() {
        return `
            <div class="stock-empty">
                <div class="stock-empty-icon">📦</div>
                <h3>ไม่พบสินค้า</h3>
                <p>ลองเปลี่ยนคำค้นหา</p>
            </div>
        `;
    }
    
    filterProducts() {
        this.renderProducts();
    }
    
    async handleStockAction(button) {
        const action = button.dataset.action;
        const productId = parseInt(button.dataset.productId);
        const product = this.products.find(p => p.id === productId);
        
        if (!product) {
            this.toast.error('ไม่พบข้อมูลสินค้า');
            return;
        }
        
        this.currentProduct = product;
        
        switch (action) {
            case 'restock':
                await this.showStockAdjustmentModal('restock');
                break;
            case 'adjust':
                await this.showStockAdjustmentModal('adjustment');
                break;
            case 'edit-product':
                await this.showEditProductModal();
                break;
        }
    }
    
    async showStockAdjustmentModal(type) {
        const modal = this.createStockAdjustmentModal(type);
        document.body.appendChild(modal);
        
        try {
            await this.modal.show(modal.id);
            
            // Setup form handling
            const form = modal.querySelector('.stock-adjustment-form');
            if (form) {
                await this.handleStockAdjustmentForm(form, type);
            }
            
        } finally {
            modal.remove();
        }
    }
    
    createStockAdjustmentModal(type) {
        const modalId = `stockAdjustmentModal_${Date.now()}`;
        const title = type === 'restock' ? 'เติมสต็อก' : 'ปรับปรุงสต็อก';
        
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal stock-adjustment-modal';
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${title}: ${this.currentProduct.name}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form class="stock-adjustment-form">
                    <div class="current-stock-info">
                        <div class="current-stock-label">สต็อกปัจจุบัน</div>
                        <div class="current-stock-value">${this.currentProduct.stock}</div>
                    </div>
                    
                    ${type === 'adjustment' ? `
                        <div class="adjustment-type">
                            <button type="button" class="adjustment-type-btn restock active" data-type="add">เพิ่มสต็อก</button>
                            <button type="button" class="adjustment-type-btn reduce" data-type="subtract">ลดสต็อก</button>
                        </div>
                    ` : ''}
                    
                    <div class="quantity-input-group">
                        <button type="button" class="quantity-btn" data-action="decrease">-</button>
                        <input type="number" class="quantity-input" value="1" min="1" max="9999">
                        <button type="button" class="quantity-btn" data-action="increase">+</button>
                    </div>
                    
                    <div class="new-stock-preview">
                        <span>สต็อกใหม่:</span>
                        <span class="new-stock-value">${this.currentProduct.stock + 1}</span>
                    </div>
                    
                    <div class="form-group">
                        <label>หมายเหตุ</label>
                        <textarea name="notes" rows="3" placeholder="ระบุเหตุผล (ไม่บังคับ)"></textarea>
                    </div>
                    
                    <button type="submit" class="btn-primary">บันทึก</button>
                </form>
            </div>
        `;
        
        // Add to modal overlay
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.appendChild(modal);
        }
        
        return modal;
    }
    
    async handleStockAdjustmentForm(form, type) {
        const quantityInput = form.querySelector('.quantity-input');
        const newStockValue = form.querySelector('.new-stock-value');
        const adjustmentTypeButtons = form.querySelectorAll('.adjustment-type-btn');
        const quantityButtons = form.querySelectorAll('.quantity-btn');
        
        let adjustmentType = 'add'; // default for restock
        
        // Update new stock preview
        const updatePreview = () => {
            const quantity = parseInt(quantityInput.value) || 0;
            let newStock = this.currentProduct.stock;
            
            if (adjustmentType === 'add') {
                newStock += quantity;
            } else {
                newStock = Math.max(0, newStock - quantity);
            }
            
            newStockValue.textContent = newStock;
        };
        
        // Adjustment type buttons (for adjustment mode)
        adjustmentTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                adjustmentTypeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                adjustmentType = button.dataset.type;
                updatePreview();
            });
        });
        
        // Quantity buttons
        quantityButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                let currentValue = parseInt(quantityInput.value) || 0;
                
                if (action === 'increase') {
                    quantityInput.value = currentValue + 1;
                } else if (action === 'decrease' && currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                }
                
                updatePreview();
            });
        });
        
        // Quantity input change
        quantityInput.addEventListener('input', updatePreview);
        
        // Form submission
        return new Promise((resolve) => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const quantity = parseInt(quantityInput.value) || 0;
                    const notes = form.querySelector('[name="notes"]').value.trim();
                    
                    if (quantity <= 0) {
                        this.toast.error('กรุณาใส่จำนวนที่ถูกต้อง');
                        return;
                    }
                    
                    let newStock = this.currentProduct.stock;
                    let changeType = 'adjustment';
                    
                    if (type === 'restock' || adjustmentType === 'add') {
                        newStock += quantity;
                        changeType = type === 'restock' ? 'restock' : 'adjustment';
                    } else {
                        newStock = Math.max(0, newStock - quantity);
                        changeType = 'adjustment';
                    }
                    
                    // Get current user
                    const currentUser = this.authService.getCurrentUser();
                    if (!currentUser) {
                        this.toast.error('ไม่พบข้อมูลผู้ใช้');
                        return;
                    }
                    
                    // Update stock
                    await this.productService.updateStock(
                        this.currentProduct.id,
                        newStock,
                        changeType,
                        null, // reference_id
                        currentUser.id,
                        notes || null
                    );
                    
                    // Update local data
                    this.currentProduct.stock = newStock;
                    const productIndex = this.products.findIndex(p => p.id === this.currentProduct.id);
                    if (productIndex !== -1) {
                        this.products[productIndex].stock = newStock;
                    }
                    
                    // Refresh display
                    this.renderProducts();
                    
                    // Close modal
                    this.modal.close();
                    
                    // Show success message
                    this.toast.success('อัปเดตสต็อกสำเร็จ');
                    
                    resolve();
                    
                } catch (error) {
                    console.error('Failed to update stock:', error);
                    this.toast.error(error.message || 'เกิดข้อผิดพลาดในการอัปเดตสต็อก');
                }
            });
        });
    }
    
    async showEditProductModal() {
        // This would show a product editing modal
        // For now, just show a placeholder
        await this.modal.alert(
            'แก้ไขสินค้า',
            `ฟีเจอร์แก้ไขสินค้า "${this.currentProduct.name}" จะเพิ่มในเวอร์ชันถัดไป`,
            'info'
        );
    }
    
    showLoading() {
        if (this.elements.stockList) {
            this.elements.stockList.innerHTML = `
                <div class="stock-loading">
                    <div class="ring-spinner"></div>
                    <p>กำลังโหลดข้อมูลสต็อก...</p>
                </div>
            `;
        }
        this.isLoading = true;
    }
    
    hideLoading() {
        this.isLoading = false;
    }
    
    async activate() {
        // Refresh products when view becomes active
        if (!this.isLoading) {
            await this.loadProducts();
        }
    }
    
    async deactivate() {
        // Clean up when view becomes inactive
        this.modal.close();
    }
}

export default StockView;