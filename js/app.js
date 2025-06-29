// Main Application Entry Point - Updated with SellView integration
import { CONFIG } from './config.js';
import { ThemeManager } from './themeManager.js';
import { AuthService } from './services/authService.js';
import { Toast } from './components/toast.js';
import { Spinner } from './components/spinner.js';
import { Modal } from './components/modal.js';
import { SellView } from './views/sellView.js';
import { StockView } from './views/stockView.js';

class App {
    constructor() {
        this.currentView = null;
        this.views = new Map();
        this.isInitialized = false;
        
        // Initialize core components
        this.themeManager = new ThemeManager();
        this.authService = new AuthService();
        this.toast = new Toast();
        this.spinner = new Spinner();
        this.modal = new Modal();
        
        // Bind methods
        this.handleViewChange = this.handleViewChange.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleThemeToggle = this.handleThemeToggle.bind(this);
    }
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Show loading spinner
            this.spinner.show('กำลังโหลดระบบ...');
            
            // Initialize theme
            await this.themeManager.init();
            
            // Initialize auth service
            this.authService.init();
            
            // Check authentication
            if (!this.authService.isLoggedIn()) {
                window.location.href = '/';
                return;
            }
            
            const user = this.authService.getCurrentUser();
            
            // Initialize views
            await this.initializeViews();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update UI based on user role
            this.updateUIForUserRole(user);
            
            // Set initial view
            this.setView('sell');
            
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
        // Initialize views
        this.views.set('sell', new SellView(this.toast, this.modal));
        this.views.set('stock', new StockView(this.toast, this.modal));
        
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
            await this.setView(viewName);
        } catch (error) {
            console.error('Failed to change view:', error);
            this.toast.error('เกิดข้อผิดพลาดในการเปลี่ยนหน้า');
        }
    }
    
    async setView(viewName) {
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
            if (viewController && typeof viewController.activate === 'function') {
                await viewController.activate();
            }
            
            this.currentView = viewName;
            
        } catch (error) {
            console.error(`Failed to set view ${viewName}:`, error);
            throw error;
        }
    }
    
    async handleLogout() {
        try {
            const confirmed = await this.modal.confirm(
                'ออกจากระบบ',
                'คุณต้องการออกจากระบบหรือไม่?'
            );
            
            if (confirmed) {
                this.spinner.show('กำลังออกจากระบบ...');
                
                // Logout
                this.authService.logout();
                
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    await app.init();
    
    // Make app globally available for debugging
    if (CONFIG.DEBUG) {
        window.app = app;
    }
});

export default App;