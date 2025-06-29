// Admin View
import { ProductService } from '../services/productService.js';
import { EmployeeService } from '../services/employeeService.js';
import { AuthService } from '../services/authService.js';
import { CONFIG } from '../config.js';

export class AdminView {
    constructor(toast, modal) {
        this.productService = new ProductService();
        this.employeeService = new EmployeeService();
        this.authService = new AuthService();
        this.toast = toast;
        this.modal = modal;
        
        this.employees = [];
        this.categories = [];
        this.isLoading = false;
        this.currentView = 'add-product'; // or 'settings'
        
        this.elements = {};
    }
    
    async init() {
        this.setupElements();
        this.setupEventListeners();
        await this.loadInitialData();
    }
    
    setupElements() {
        this.elements = {
            // Add Product elements
            addProductForm: document.getElementById('addProductForm'),
            categorySelect: document.getElementById('categorySelect'),
            
            // Settings elements
            employeesList: document.getElementById('employeesList'),
            addEmployeeBtn: document.getElementById('addEmployeeBtn'),
            employeeModal: document.getElementById('employeeModal'),
            employeeForm: document.getElementById('employeeForm')
        };
    }
    
    setupEventListeners() {
        // Add Product Form
        if (this.elements.addProductForm) {
            this.elements.addProductForm.addEventListener('submit', (e) => {
                this.handleAddProduct(e);
            });
        }
        
        // Add Employee Button
        if (this.elements.addEmployeeBtn) {
            this.elements.addEmployeeBtn.addEventListener('click', () => {
                this.showAddEmployeeModal();
            });
        }
        
        // Employee Form
        if (this.elements.employeeForm) {
            this.elements.employeeForm.addEventListener('submit', (e) => {
                this.handleAddEmployee(e);
            });
        }
        
        // Employee Actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.employee-action-btn')) {
                this.handleEmployeeAction(e.target.closest('.employee-action-btn'));
            }
        });
    }
    
    async loadInitialData() {
        try {
            this.showLoading();
            
            // Check if user is admin
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser || currentUser.role !== 'admin') {
                this.toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
                return;
            }
            
            // Load data based on current view
            if (this.currentView === 'add-product') {
                await this.loadCategories();
            } else if (this.currentView === 'settings') {
                await this.loadEmployees();
            }
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            this.hideLoading();
        }
    }
    
    async loadCategories() {
        try {
            this.categories = await this.productService.getCategories();
            this.renderCategoryOptions();
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.toast.error('เกิดข้อผิดพลาดในการโหลดหมวดหมู่');
        }
    }
    
    renderCategoryOptions() {
        if (!this.elements.categorySelect) return;
        
        const optionsHtml = [
            '<option value="">เลือกหมวดหมู่</option>',
            ...this.categories.map(category => 
                `<option value="${category.id}">${category.name}</option>`
            )
        ].join('');
        
        this.elements.categorySelect.innerHTML = optionsHtml;
    }
    
    async handleAddProduct(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(this.elements.addProductForm);
            const productData = {
                name: formData.get('name'),
                category_id: parseInt(formData.get('category_id')),
                barcode: formData.get('barcode') || null,
                image_url: formData.get('image_url') || null,
                stock: parseInt(formData.get('stock')) || 0,
                min_stock: parseInt(formData.get('min_stock')) || CONFIG.LOW_STOCK_THRESHOLD
            };
            
            // Validate required fields
            if (!productData.name || !productData.category_id) {
                this.toast.error('กรุณากรอกข้อมูลที่จำเป็น');
                return;
            }
            
            // Show loading
            const loadingToast = this.toast.loading('กำลังเพิ่มสินค้า...');
            
            // Create product
            const product = await this.productService.createProduct(productData);
            
            // Success
            loadingToast.success('เพิ่มสินค้าสำเร็จ!');
            
            // Reset form
            this.elements.addProductForm.reset();
            
        } catch (error) {
            console.error('Failed to add product:', error);
            this.toast.error(error.message || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า');
        }
    }
    
    async loadEmployees() {
        try {
            this.employees = await this.employeeService.getEmployees({ activeOnly: false });
            this.renderEmployees();
        } catch (error) {
            console.error('Failed to load employees:', error);
            this.toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน');
        }
    }
    
    renderEmployees() {
        if (!this.elements.employeesList) return;
        
        if (this.employees.length === 0) {
            this.elements.employeesList.innerHTML = this.getEmptyEmployeesState();
            return;
        }
        
        const employeesHtml = this.employees.map(employee => this.createEmployeeItem(employee)).join('');
        this.elements.employeesList.innerHTML = employeesHtml;
    }
    
    createEmployeeItem(employee) {
        const initials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase();
        const createdDate = new Date(employee.created_at).toLocaleDateString('th-TH');
        
        return `
            <div class="employee-item" data-employee-id="${employee.id}">
                <div class="employee-info">
                    <div class="employee-avatar">${initials}</div>
                    <div class="employee-details">
                        <h3 class="employee-name">${employee.name}</h3>
                        <div class="employee-meta">
                            <span class="employee-role ${employee.role}">${CONFIG.ROLES[employee.role] || employee.role}</span>
                            <span class="employee-pin">PIN: ${employee.pin}</span>
                            <span class="employee-status ${employee.is_active ? 'active' : 'inactive'}">
                                ${employee.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                            </span>
                            <span class="employee-created">สร้างเมื่อ: ${createdDate}</span>
                        </div>
                    </div>
                </div>
                
                <div class="employee-actions">
                    <button class="employee-action-btn edit" data-action="edit" data-employee-id="${employee.id}" title="แก้ไข">
                        <svg viewBox="0 0 24 24">
                            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                        </svg>
                    </button>
                    
                    <button class="employee-action-btn toggle" data-action="toggle" data-employee-id="${employee.id}" title="${employee.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}">
                        <svg viewBox="0 0 24 24">
                            <path d="${employee.is_active ? 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z' : 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z'}"/>
                        </svg>
                    </button>
                    
                    <button class="employee-action-btn delete" data-action="delete" data-employee-id="${employee.id}" title="ลบ">
                        <svg viewBox="0 0 24 24">
                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
    
    getEmptyEmployeesState() {
        return `
            <div class="admin-empty">
                <div class="admin-empty-icon">👥</div>
                <h3>ยังไม่มีพนักงาน</h3>
                <p>เริ่มต้นด้วยการเพิ่มพนักงานคนแรก</p>
            </div>
        `;
    }
    
    async showAddEmployeeModal() {
        if (!this.elements.employeeModal) return;
        
        // Reset form
        if (this.elements.employeeForm) {
            this.elements.employeeForm.reset();
        }
        
        await this.modal.show('employeeModal');
    }
    
    async handleAddEmployee(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(this.elements.employeeForm);
            const employeeData = {
                name: formData.get('name'),
                pin: formData.get('pin'),
                role: formData.get('role')
            };
            
            // Validate required fields
            if (!employeeData.name || !employeeData.pin || !employeeData.role) {
                this.toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
                return;
            }
            
            // Validate PIN
            if (employeeData.pin.length !== CONFIG.VALIDATION.PIN_LENGTH) {
                this.toast.error(`รหัส PIN ต้องมี ${CONFIG.VALIDATION.PIN_LENGTH} หลัก`);
                return;
            }
            
            // Show loading
            const loadingToast = this.toast.loading('กำลังเพิ่มพนักงาน...');
            
            // Create employee
            const employee = await this.employeeService.createEmployee(employeeData);
            
            // Success
            loadingToast.success('เพิ่มพนักงานสำเร็จ!');
            
            // Close modal
            this.modal.close();
            
            // Refresh employees list
            await this.loadEmployees();
            
        } catch (error) {
            console.error('Failed to add employee:', error);
            this.toast.error(error.message || 'เกิดข้อผิดพลาดในการเพิ่มพนักงาน');
        }
    }
    
    async handleEmployeeAction(button) {
        const action = button.dataset.action;
        const employeeId = parseInt(button.dataset.employeeId);
        const employee = this.employees.find(e => e.id === employeeId);
        
        if (!employee) {
            this.toast.error('ไม่พบข้อมูลพนักงาน');
            return;
        }
        
        try {
            switch (action) {
                case 'edit':
                    await this.handleEditEmployee(employee);
                    break;
                case 'toggle':
                    await this.handleToggleEmployee(employee);
                    break;
                case 'delete':
                    await this.handleDeleteEmployee(employee);
                    break;
            }
        } catch (error) {
            console.error(`Failed to ${action} employee:`, error);
            this.toast.error(error.message || 'เกิดข้อผิดพลาดในการดำเนินการ');
        }
    }
    
    async handleEditEmployee(employee) {
        // For now, just show a placeholder
        await this.modal.alert(
            'แก้ไขพนักงาน',
            `ฟีเจอร์แก้ไขข้อมูลพนักงาน "${employee.name}" จะเพิ่มในเวอร์ชันถัดไป`,
            'info'
        );
    }
    
    async handleToggleEmployee(employee) {
        const action = employee.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน';
        const confirmed = await this.modal.confirm(
            `${action}พนักงาน`,
            `คุณต้องการ${action}พนักงาน "${employee.name}" หรือไม่?`
        );
        
        if (confirmed) {
            const loadingToast = this.toast.loading(`กำลัง${action}พนักงาน...`);
            
            await this.employeeService.toggleEmployeeStatus(employee.id);
            
            loadingToast.success(`${action}พนักงานสำเร็จ!`);
            
            // Refresh employees list
            await this.loadEmployees();
        }
    }
    
    async handleDeleteEmployee(employee) {
        const confirmed = await this.modal.confirm(
            'ลบพนักงาน',
            `คุณต้องการลบพนักงาน "${employee.name}" หรือไม่?\n\nการดำเนินการนี้จะทำให้พนักงานไม่สามารถเข้าสู่ระบบได้`
        );
        
        if (confirmed) {
            const reason = await this.modal.prompt(
                'เหตุผลในการลบ',
                'กรุณาระบุเหตุผลในการลบพนักงาน (ไม่บังคับ)',
                '',
                { placeholder: 'เช่น ลาออก, โอนย้าย, ฯลฯ' }
            );
            
            const currentUser = this.authService.getCurrentUser();
            const loadingToast = this.toast.loading('กำลังลบพนักงาน...');
            
            await this.employeeService.deleteEmployee(employee.id, currentUser.id, reason);
            
            loadingToast.success('ลบพนักงานสำเร็จ!');
            
            // Refresh employees list
            await this.loadEmployees();
        }
    }
    
    showLoading() {
        this.isLoading = true;
    }
    
    hideLoading() {
        this.isLoading = false;
    }
    
    async activate() {
        // Determine which view is active
        const activeView = document.querySelector('.view.active');
        if (activeView) {
            if (activeView.id === 'addProductView') {
                this.currentView = 'add-product';
            } else if (activeView.id === 'settingsView') {
                this.currentView = 'settings';
            }
        }
        
        // Load data for current view
        if (!this.isLoading) {
            await this.loadInitialData();
        }
    }
    
    async deactivate() {
        // Clean up when view becomes inactive
        this.modal.close();
    }
}

export default AdminView;