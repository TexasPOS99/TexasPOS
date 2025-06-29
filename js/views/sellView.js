// Sell View - Fixed for hardcoded data
import { ProductService } from '../services/productService.js';
import { AuthService } from '../services/authService.js';
import { CONFIG } from '../config.js';

export class SellView {
    constructor(toast, modal) {
        this.productService = new ProductService();
        this.authService = new AuthService();
        this.toast = toast;
        this.modal = modal;
        
        this.products = [];
        this.categories = [];
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.isLoading = false;
        this.cart = new Map(); // Simple cart implementation
        
        this.elements = {};
    }
    
    async init() {
        this.setupElements();
        this.setupEventListeners();
        await this.loadInitialData();
    }
    
    setupElements() {
        this.elements = {
            productsGrid: document.getElementById('productsGrid'),
            productSearch: document.getElementById('productSearch'),
            categoriesFilter: document.querySelector('.categories-filter'),
            checkoutModal: document.getElementById('checkoutModal'),
            cartItems: document.getElementById('cartItems'),
            checkoutTotal: document.getElementById('checkoutTotal'),
            cashInput: document.getElementById('cashInput'),
            cashReceived: document.getElementById('cashReceived'),
            changeAmount: document.getElementById('changeAmount'),
            confirmPayment: document.getElementById('confirmPayment'),
            priceModal: document.getElementById('priceModal'),
            priceOptions: document.getElementById('priceOptions')
        };
    }
    
    setupEventListeners() {
        // Search functionality
        if (this.elements.productSearch) {
            this.elements.productSearch.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.debounceSearch();
            });
        }
        
        // Category filter
        if (this.elements.categoriesFilter) {
            this.elements.categoriesFilter.addEventListener('click', (e) => {
                if (e.target.classList.contains('category-btn')) {
                    this.handleCategoryChange(e.target);
                }
            });
        }
        
        // Product grid clicks
        if (this.elements.productsGrid) {
            this.elements.productsGrid.addEventListener('click', (e) => {
                const productCard = e.target.closest('.product-card');
                if (productCard && !productCard.classList.contains('out-of-stock')) {
                    this.handleProductClick(productCard);
                }
            });
        }
        
        // Payment method selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('payment-btn')) {
                this.handlePaymentMethodSelect(e.target);
            }
        });
        
        // Cash input
        if (this.elements.cashReceived) {
            this.elements.cashReceived.addEventListener('input', (e) => {
                this.calculateChange();
            });
        }
        
        // Confirm payment
        if (this.elements.confirmPayment) {
            this.elements.confirmPayment.addEventListener('click', () => {
                this.processPayment();
            });
        }
        
        // Cart quantity controls
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quantity-btn')) {
                this.handleQuantityChange(e.target);
            }
        });
        
        // Checkout button
        const checkoutFloat = document.getElementById('checkoutFloat');
        if (checkoutFloat) {
            checkoutFloat.addEventListener('click', () => {
                this.showCheckoutModal();
            });
        }
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
    
    async loadInitialData() {
        try {
            this.showLoading();
            
            // Load categories and products in parallel
            const [categories, products] = await Promise.all([
                this.productService.getCategories(),
                this.productService.getProducts({ activeOnly: true })
            ]);
            
            this.categories = categories;
            this.products = products;
            
            this.renderCategories();
            this.renderProducts();
            this.updateCheckoutButton();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
        } finally {
            this.hideLoading();
        }
    }
    
    renderCategories() {
        if (!this.elements.categoriesFilter) return;
        
        const categoriesHtml = [
            '<button class="category-btn active" data-category="all">ทั้งหมด</button>',
            ...this.categories.map(category => 
                `<button class="category-btn" data-category="${category.id}">${category.name}</button>`
            )
        ].join('');
        
        this.elements.categoriesFilter.innerHTML = categoriesHtml;
    }
    
    renderProducts() {
        if (!this.elements.productsGrid) return;
        
        const filteredProducts = this.getFilteredProducts();
        
        if (filteredProducts.length === 0) {
            this.elements.productsGrid.innerHTML = this.getEmptyState();
            return;
        }
        
        const productsHtml = filteredProducts.map(product => this.createProductCard(product)).join('');
        this.elements.productsGrid.innerHTML = productsHtml;
    }
    
    getFilteredProducts() {
        let filtered = this.products;
        
        // Filter by category
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(product => product.category_id == this.currentCategory);
        }
        
        // Filter by search term
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(term) ||
                (product.barcode && product.barcode.toLowerCase().includes(term))
            );
        }
        
        return filtered;
    }
    
    createProductCard(product) {
        const stockStatus = this.getStockStatus(product);
        const stockBadge = this.createStockBadge(product);
        const pricesDisplay = this.createPricesDisplay(product.prices);
        const multiPriceIndicator = product.prices.length > 1 ? 
            '<div class="multiple-prices-indicator"><svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/></svg>หลายราคา</div>' : '';
        
        return `
            <div class="product-card ${stockStatus.class}" data-product-id="${product.id}">
                ${multiPriceIndicator}
                ${stockBadge}
                <div class="product-image">
                    ${product.image_url ? 
                        `<img src="${product.image_url}" alt="${product.name}" loading="lazy">` :
                        '<div class="product-image-placeholder">📦</div>'
                    }
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-category">${product.category_name || ''}</div>
                    <div class="product-stock">
                        <svg class="stock-icon" viewBox="0 0 24 24">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>
                        </svg>
                        คงเหลือ ${product.stock} ชิ้น
                    </div>
                    <div class="product-prices">
                        ${pricesDisplay}
                    </div>
                </div>
            </div>
        `;
    }
    
    getStockStatus(product) {
        if (product.stock === 0) {
            return { class: 'out-of-stock', text: 'หมดสต็อก' };
        } else if (product.stock <= product.min_stock) {
            return { class: 'low-stock', text: 'สต็อกต่ำ' };
        } else {
            return { class: 'in-stock', text: 'มีสต็อก' };
        }
    }
    
    createStockBadge(product) {
        const status = this.getStockStatus(product);
        return `<div class="stock-badge ${status.class}">${status.text}</div>`;
    }
    
    createPricesDisplay(prices) {
        if (!prices || prices.length === 0) {
            return '<div class="price-item"><span class="price-label">ไม่มีราคา</span></div>';
        }
        
        // Sort prices: default first, then by price
        const sortedPrices = [...prices].sort((a, b) => {
            if (a.is_default && !b.is_default) return -1;
            if (!a.is_default && b.is_default) return 1;
            return a.price - b.price;
        });
        
        return sortedPrices.map(price => `
            <div class="price-item ${price.is_default ? 'default' : ''}">
                <span class="price-label">${price.label}</span>
                <span class="price-amount">${this.formatCurrency(price.price)}</span>
            </div>
        `).join('');
    }
    
    getEmptyState() {
        return `
            <div class="products-empty">
                <div class="products-empty-icon">🔍</div>
                <h3>ไม่พบสินค้า</h3>
                <p>ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</p>
            </div>
        `;
    }
    
    handleCategoryChange(button) {
        // Update active state
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update current category
        this.currentCategory = button.dataset.category;
        
        // Filter products
        this.filterProducts();
    }
    
    filterProducts() {
        this.renderProducts();
    }
    
    async handleProductClick(productCard) {
        const productId = parseInt(productCard.dataset.productId);
        const product = this.products.find(p => p.id === productId);
        
        if (!product || product.stock === 0) {
            this.toast.warning('สินค้าหมดสต็อก');
            return;
        }
        
        try {
            // Add selection animation
            productCard.classList.add('selected');
            setTimeout(() => productCard.classList.remove('selected'), 300);
            
            if (product.prices.length === 1) {
                // Single price - add directly to cart
                await this.addToCart(product, product.prices[0]);
            } else if (product.prices.length > 1) {
                // Multiple prices - show selection modal
                await this.showPriceSelectionModal(product);
            } else {
                this.toast.error('สินค้านี้ยังไม่มีราคา');
            }
            
        } catch (error) {
            console.error('Failed to handle product click:', error);
            this.toast.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า');
        }
    }
    
    async showPriceSelectionModal(product) {
        if (!this.elements.priceModal || !this.elements.priceOptions) return;
        
        // Populate price options
        const pricesHtml = product.prices.map(price => `
            <div class="price-option" data-price-id="${price.id}">
                <div class="price-info">
                    <div class="price-label">${price.label}</div>
                    ${price.is_default ? '<small>ราคาหลัก</small>' : ''}
                </div>
                <div class="price-amount">${this.formatCurrency(price.price)}</div>
            </div>
        `).join('');
        
        this.elements.priceOptions.innerHTML = pricesHtml;
        
        // Show modal
        await this.modal.show('priceModal');
        
        // Handle price selection
        return new Promise((resolve) => {
            const handlePriceSelect = async (e) => {
                const priceOption = e.target.closest('.price-option');
                if (priceOption) {
                    const priceId = parseInt(priceOption.dataset.priceId);
                    const selectedPrice = product.prices.find(p => p.id === priceId);
                    
                    if (selectedPrice) {
                        this.modal.close();
                        await this.addToCart(product, selectedPrice);
                    }
                    
                    // Clean up
                    this.elements.priceOptions.removeEventListener('click', handlePriceSelect);
                    resolve();
                }
            };
            
            this.elements.priceOptions.addEventListener('click', handlePriceSelect);
        });
    }
    
    async addToCart(product, price, quantity = 1) {
        try {
            const itemKey = `${product.id}_${price.id}`;
            
            if (this.cart.has(itemKey)) {
                const existingItem = this.cart.get(itemKey);
                const newQuantity = existingItem.quantity + quantity;
                
                if (newQuantity > product.stock) {
                    this.toast.error('จำนวนเกินสต็อกที่มี');
                    return;
                }
                
                existingItem.quantity = newQuantity;
                existingItem.subtotal = existingItem.price * newQuantity;
            } else {
                if (quantity > product.stock) {
                    this.toast.error('จำนวนเกินสต็อกที่มี');
                    return;
                }
                
                const cartItem = {
                    id: itemKey,
                    product_id: product.id,
                    name: product.name,
                    price: price.price,
                    price_label: price.label,
                    price_id: price.id,
                    quantity: quantity,
                    subtotal: price.price * quantity,
                    stock: product.stock
                };
                
                this.cart.set(itemKey, cartItem);
            }
            
            this.toast.success(`เพิ่ม ${product.name} ในตะกร้าแล้ว`);
            this.updateCheckoutButton();
            
        } catch (error) {
            this.toast.error(error.message);
        }
    }
    
    async showCheckoutModal() {
        if (!this.elements.checkoutModal || this.cart.size === 0) {
            this.toast.warning('ตะกร้าสินค้าว่างเปล่า');
            return;
        }
        
        this.renderCartItems();
        this.updateCheckoutTotal();
        
        await this.modal.show('checkoutModal');
    }
    
    renderCartItems() {
        if (!this.elements.cartItems) return;
        
        const items = Array.from(this.cart.values());
        
        if (items.length === 0) {
            this.elements.cartItems.innerHTML = '<p>ไม่มีสินค้าในตะกร้า</p>';
            return;
        }
        
        const itemsHtml = items.map(item => `
            <div class="cart-item" data-item-id="${item.id}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-details">${item.price_label} - ${this.formatCurrency(item.price)}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" data-action="decrease" data-item-id="${item.id}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn" data-action="increase" data-item-id="${item.id}">+</button>
                </div>
                <div class="cart-item-total">${this.formatCurrency(item.subtotal)}</div>
            </div>
        `).join('');
        
        this.elements.cartItems.innerHTML = itemsHtml;
    }
    
    updateCheckoutTotal() {
        if (!this.elements.checkoutTotal) return;
        
        const total = this.getTotalAmount();
        this.elements.checkoutTotal.textContent = this.formatCurrency(total);
    }
    
    getTotalAmount() {
        return Array.from(this.cart.values()).reduce((sum, item) => sum + item.subtotal, 0);
    }
    
    getItemCount() {
        return Array.from(this.cart.values()).reduce((sum, item) => sum + item.quantity, 0);
    }
    
    updateCheckoutButton() {
        const checkoutFloat = document.getElementById('checkoutFloat');
        const cartCount = document.getElementById('cartCount');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!checkoutFloat || !cartCount || !cartTotal) return;
        
        const itemCount = this.getItemCount();
        const totalAmount = this.getTotalAmount();
        
        if (itemCount > 0) {
            checkoutFloat.classList.add('visible');
            cartCount.textContent = itemCount;
            cartTotal.textContent = this.formatCurrency(totalAmount);
        } else {
            checkoutFloat.classList.remove('visible');
        }
    }
    
    handleQuantityChange(button) {
        const action = button.dataset.action;
        const itemId = button.dataset.itemId;
        const item = this.cart.get(itemId);
        
        if (!item) return;
        
        try {
            if (action === 'increase') {
                if (item.quantity + 1 > item.stock) {
                    this.toast.error('จำนวนเกินสต็อกที่มี');
                    return;
                }
                item.quantity += 1;
                item.subtotal = item.price * item.quantity;
            } else if (action === 'decrease') {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                    item.subtotal = item.price * item.quantity;
                } else {
                    this.cart.delete(itemId);
                }
            }
            
            // Update display
            this.renderCartItems();
            this.updateCheckoutTotal();
            this.updateCheckoutButton();
            
        } catch (error) {
            this.toast.error(error.message);
        }
    }
    
    handlePaymentMethodSelect(button) {
        const method = button.dataset.method;
        
        // Update active state
        document.querySelectorAll('.payment-btn').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        
        // Show/hide cash input
        if (this.elements.cashInput) {
            if (method === 'cash') {
                this.elements.cashInput.style.display = 'block';
                if (this.elements.cashReceived) {
                    this.elements.cashReceived.focus();
                }
            } else {
                this.elements.cashInput.style.display = 'none';
            }
        }
        
        this.calculateChange();
    }
    
    calculateChange() {
        if (!this.elements.cashReceived || !this.elements.changeAmount) return;
        
        const cashReceived = parseFloat(this.elements.cashReceived.value) || 0;
        const total = this.getTotalAmount();
        const change = cashReceived - total;
        
        this.elements.changeAmount.textContent = `เงินทอน: ${this.formatCurrency(Math.max(0, change))}`;
        
        // Update button state
        if (this.elements.confirmPayment) {
            const selectedMethod = document.querySelector('.payment-btn.selected')?.dataset.method;
            const isValid = selectedMethod === 'transfer' || (selectedMethod === 'cash' && cashReceived >= total);
            
            this.elements.confirmPayment.disabled = !isValid;
        }
    }
    
    async processPayment() {
        try {
            const selectedMethodBtn = document.querySelector('.payment-btn.selected');
            if (!selectedMethodBtn) {
                this.toast.error('กรุณาเลือกวิธีการชำระเงิน');
                return;
            }
            
            const paymentMethod = selectedMethodBtn.dataset.method;
            const items = Array.from(this.cart.values());
            const totalAmount = this.getTotalAmount();
            
            if (items.length === 0) {
                this.toast.error('ไม่มีสินค้าในตะกร้า');
                return;
            }
            
            // Validate cash payment
            let cashReceived = null;
            if (paymentMethod === 'cash') {
                cashReceived = parseFloat(this.elements.cashReceived?.value) || 0;
                if (cashReceived < totalAmount) {
                    this.toast.error('จำนวนเงินที่รับไม่เพียงพอ');
                    return;
                }
            }
            
            // Get current user
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) {
                this.toast.error('ไม่พบข้อมูลผู้ใช้');
                return;
            }
            
            // Show loading
            const loadingToast = this.toast.loading('กำลังประมวลผลการขาย...');
            
            // Simulate sale processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Generate sale number
            const saleNumber = `S${Date.now()}`;
            const changeAmount = paymentMethod === 'cash' ? cashReceived - totalAmount : 0;
            
            // Update stock
            items.forEach(item => {
                const product = this.products.find(p => p.id === item.product_id);
                if (product) {
                    product.stock -= item.quantity;
                }
            });
            
            // Success
            loadingToast.success('ขายสินค้าสำเร็จ!');
            
            // Clear cart
            this.cart.clear();
            this.updateCheckoutButton();
            
            // Close modal
            this.modal.close();
            
            // Show sale summary
            this.showSaleSummary({
                sale_number: saleNumber,
                total_amount: totalAmount,
                payment_method: paymentMethod,
                change_amount: changeAmount
            });
            
            // Refresh products display
            this.renderProducts();
            
        } catch (error) {
            console.error('Payment processing failed:', error);
            this.toast.error(error.message || 'เกิดข้อผิดพลาดในการประมวลผลการขาย');
        }
    }
    
    showSaleSummary(sale) {
        const changeAmount = sale.change_amount || 0;
        const message = `
            <div style="text-align: center;">
                <h3>ขายสินค้าสำเร็จ!</h3>
                <p><strong>เลขที่:</strong> ${sale.sale_number}</p>
                <p><strong>ยอดรวม:</strong> ${this.formatCurrency(sale.total_amount)}</p>
                ${sale.payment_method === 'cash' && changeAmount > 0 ? 
                    `<p><strong>เงินทอน:</strong> ${this.formatCurrency(changeAmount)}</p>` : ''
                }
            </div>
        `;
        
        this.modal.alert('สำเร็จ', message, 'success');
    }
    
    showLoading() {
        if (this.elements.productsGrid) {
            this.elements.productsGrid.innerHTML = `
                <div class="products-loading">
                    <div class="ring-spinner"></div>
                    <p>กำลังโหลดสินค้า...</p>
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
        // Refresh products when view becomes active
        if (!this.isLoading) {
            await this.loadInitialData();
        }
    }
    
    async deactivate() {
        // Clean up when view becomes inactive
        this.modal.close();
    }
}

export default SellView;