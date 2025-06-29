// Main Application Entry Point
import { CONFIG } from './config.js';
import { ThemeManager } from './themeManager.js';
import { AuthStore } from './stores/authStore.js';
import { CartStore } from './stores/cartStore.js';
import { ShiftStore } from './stores/shiftStore.js';
import { Toast } from './components/toast.js';
import { Spinner } from './components/spinner.js';
import { Modal } from './components/modal.js';
import { SellView } from './views/sellView.js';
import { StockView } from './views/stockView.js';
import { HistoryView } from './views/historyView.js';
import { AdminView } from './views/adminView.js';
import { SettingsView } from './views/settingsView.js';

class App {
    constructor() {
        this.currentView = null;
        this.views = new Map();
        this.isInitialized = false;
        
        // Initialize core components
        this.themeManager = new ThemeManager();
        this.authStore = new AuthStore();
        this.cartStore = new CartStore();
        this.shiftStore = new ShiftStore();
        this.toast = new Toast();
        this.spinner = new Spinner();
        this.modal = new Modal();
        
        // Bind methods
        this.handleViewChange = this.handleViewChange.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleThemeToggle = this.handleThemeToggle.bind(this);
        this.updateCheckoutButton = this.updateCheckoutButton.bind(this);
        this.handleCheckoutClick = this.handleCheckoutClick.bind(this);
    }
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Show loading spinner
            this.spinner.show('กำลังโหลดระบบ...');
            
            // Initialize theme
            await this.themeManager.init();
            
            // Check authentication
            const user = await this.authStore.getCurrentUser();
            if (!user) {
                window.location.href = '/';
                return;
            }
            
            // Initialize views
            await this.initializeViews();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update UI based on user role
            this.updateUIForUserRole(user);
            
            // Initialize cart store
            await this.cartStore.init();
            
            // Initialize shift store
            await this.shiftStore.init();
            
            // Set initial view
            this.setView('sell');
            
            // Update checkout button
            this.updateCheckoutButton();
            
            this.isInitialized = true;
            
            // Hide loading spinner
            this.spinner.hide();
            
            // Show welcome message
            this.toast.success(`ยินดีต้อนรับ ${user.name}!`);
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.spinner.hide();
            this.toast.error('เกิดข้อผิดพลาดในการโหลดระบบ');
        }
    }
    
    async initializeViews() {
        // Initialize all views
        this.views.set('sell', new SellView(this.cartStore, this.toast, this.modal));
        this.views.set('stock', new StockView(this.toast, this.modal));
        this.views.set('history', new HistoryView(this.toast));
        this.views.set('add-product', new AdminView(this.toast, this.modal));
        this.views.set('shift-summary', new SettingsView(this.shiftStore, this.toast));
        this.views.set('settings', new AdminView(this.toast, this.modal));
        
        // Initialize each view
        for (const [name, view] of this.views) {
            try {
                await view.init();
            } catch (error) {
                console.error(`Failed to initialize ${name} view:`, error);
            }
        }
    }
    
    setupEventListeners() {
        // Menu item clicks
        document.querySelectorAll('.menu-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.handleViewChange(view);
            });
        });
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout);
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.handleThemeToggle);
        }
        
        // Checkout button
        const checkoutFloat = document.getElementById('checkoutFloat');
        if (checkoutFloat) {
            checkoutFloat.addEventListener('click', this.handleCheckoutClick);
        }
        
        // Cart store events
        this.cartStore.on('cartUpdated', this.updateCheckoutButton);
        this.cartStore.on('itemAdded', (item) => {
            this.toast.success(`เพิ่ม ${item.name} ในตะกร้าแล้ว`);
        });
        this.cartStore.on('itemRemoved', (item) => {
            this.toast.info(`ลบ ${item.name} ออกจากตะกร้าแล้ว`);
        });
        
        // Window events
        window.addEventListener('beforeunload', () => {
            this.cartStore.saveToStorage();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.setView('sell');
                        break;
                    case '2':
                        e.preventDefault();
                        this.setView('history');
                        break;
                    case '3':
                        e.preventDefault();
                        this.setView('stock');
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (this.cartStore.getItemCount() > 0) {
                            this.handleCheckoutClick();
                        }
                        break;
                }
            }
        });
    }
    
    updateUIForUserRole(user) {
        const body = document.body;
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        
        // Update user info
        if (userNameEl) userNameEl.textContent = user.name;
        if (userRoleEl) userRoleEl.textContent = user.role === 'admin' ? 'แอดมิน' : 'พนักงาน';
        
        // Show/hide admin features
        if (user.role === 'admin') {
            body.classList.add('admin');
        } else {
            body.classList.remove('admin');
        }
    }
    
    async handleViewChange(viewName) {
        if (this.currentView === viewName) return;
        
        try {
            // Show loading for view transition
            this.showViewTransition();
            
            // Deactivate current view
            if (this.currentView && this.views.has(this.currentView)) {
                await this.views.get(this.currentView).deactivate();
            }
            
            // Set new view
            await this.setView(viewName);
            
        } catch (error) {
            console.error('Failed to change view:', error);
            this.toast.error('เกิดข้อผิดพลาดในการเปลี่ยนหน้า');
        }
    }
    
    async setView(viewName) {
        if (!this.views.has(viewName)) {
            console.error(`View ${viewName} not found`);
            return;
        }
        
        try {
            // Update menu active state
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const activeMenuItem = document.querySelector(`[data-view="${viewName}"]`);
            if (activeMenuItem) {
                activeMenuItem.classList.add('active');
            }
            
            // Update page title
            const pageTitleEl = document.getElementById('pageTitle');
            if (pageTitleEl) {
                const titles = {
                    'sell': 'ขายของ',
                    'history': 'ประวัติการขาย',
                    'stock': 'จัดการสินค้า',
                    'add-product': 'เพิ่มสินค้า',
                    'shift-summary': 'สรุปยอดกะ',
                    'settings': 'ตั้งค่า'
                };
                pageTitleEl.textContent = titles[viewName] || 'TexasPOS';
            }
            
            // Hide all views
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
            });
            
            // Show target view
            const targetView = document.getElementById(`${viewName}View`);
            if (targetView) {
                targetView.classList.add('active');
            }
            
            // Activate view controller
            const viewController = this.views.get(viewName);
            if (viewController) {
                await viewController.activate();
            }
            
            this.currentView = viewName;
            
        } catch (error) {
            console.error(`Failed to set view ${viewName}:`, error);
            throw error;
        }
    }
    
    showViewTransition() {
        // Create a subtle loading effect for view transitions
        const progressBar = document.createElement('div');
        progressBar.className = 'view-transition-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: var(--accent-gradient);
            z-index: 9999;
            transform: scaleX(0);
            transform-origin: left;
            animation: viewTransition 0.3s ease forwards;
        `;
        
        document.body.appendChild(progressBar);
        
        setTimeout(() => {
            progressBar.remove();
        }, 300);
    }
    
    async handleLogout() {
        try {
            const confirmed = await this.modal.confirm(
                'ออกจากระบบ',
                'คุณต้องการออกจากระบบหรือไม่?'
            );
            
            if (confirmed) {
                this.spinner.show('กำลังออกจากระบบ...');
                
                // Clear cart
                this.cartStore.clear();
                
                // Logout
                await this.authStore.logout();
                
                // Redirect to login
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout failed:', error);
            this.spinner.hide();
            this.toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
        }
    }
    
    handleThemeToggle() {
        this.themeManager.toggle();
        const currentTheme = this.themeManager.getCurrentTheme();
        this.toast.info(`เปลี่ยนเป็นธีม${currentTheme === 'dark' ? 'มืด' : 'สว่าง'}แล้ว`);
    }
    
    updateCheckoutButton() {
        const checkoutFloat = document.getElementById('checkoutFloat');
        const cartCount = document.getElementById('cartCount');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!checkoutFloat || !cartCount || !cartTotal) return;
        
        const itemCount = this.cartStore.getItemCount();
        const totalAmount = this.cartStore.getTotalAmount();
        
        if (itemCount > 0) {
            checkoutFloat.classList.add('visible');
            cartCount.textContent = itemCount;
            cartTotal.textContent = `${totalAmount.toLocaleString()} ฿`;
        } else {
            checkoutFloat.classList.remove('visible');
        }
    }
    
    async handleCheckoutClick() {
        if (this.cartStore.getItemCount() === 0) {
            this.toast.warning('ตะกร้าสินค้าว่างเปล่า');
            return;
        }
        
        try {
            const sellView = this.views.get('sell');
            if (sellView && typeof sellView.showCheckoutModal === 'function') {
                await sellView.showCheckoutModal();
            }
        } catch (error) {
            console.error('Failed to show checkout modal:', error);
            this.toast.error('เกิดข้อผิดพลาดในการเปิดหน้าชำระเงิน');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Add CSS animation for view transitions
    const style = document.createElement('style');
    style.textContent = `
        @keyframes viewTransition {
            0% { transform: scaleX(0); }
            100% { transform: scaleX(1); }
        }
    `;
    document.head.appendChild(style);
    
    // Initialize app
    const app = new App();
    await app.init();
    
    // Make app globally available for debugging
    if (CONFIG.DEBUG) {
        window.app = app;
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Show user-friendly error message
    if (window.app && window.app.toast) {
        window.app.toast.error('เกิดข้อผิดพลาดที่ไม่คาดคิด');
    }
});

// Handle global errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Show user-friendly error message
    if (window.app && window.app.toast) {
        window.app.toast.error('เกิดข้อผิดพลาดในระบบ');
    }
});

export default App;