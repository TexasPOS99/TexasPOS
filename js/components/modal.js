// Modal Component
import { CONFIG } from '../config.js';

export class Modal {
    constructor() {
        this.overlay = null;
        this.currentModal = null;
        this.isOpen = false;
        this.callbacks = new Map();
        
        this.init();
    }
    
    init() {
        // Get or create modal overlay
        this.overlay = document.getElementById('modalOverlay');
        if (!this.overlay) {
            this.createOverlay();
        }
        
        this.setupEventListeners();
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'modalOverlay';
        this.overlay.className = 'modal-overlay';
        document.body.appendChild(this.overlay);
    }
    
    setupEventListeners() {
        // Close modal when clicking overlay
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // Handle close button clicks
        this.overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                this.close();
            }
        });
    }
    
    // Show modal
    show(modalId, data = null) {
        return new Promise((resolve, reject) => {
            try {
                const modal = document.getElementById(modalId);
                if (!modal) {
                    throw new Error(`Modal ${modalId} not found`);
                }
                
                // Store callback for this modal
                this.callbacks.set(modalId, { resolve, reject });
                
                // Hide all modals first
                this.hideAllModals();
                
                // Show target modal
                modal.style.display = 'flex';
                this.currentModal = modal;
                
                // Show overlay
                this.overlay.classList.add('active');
                this.isOpen = true;
                
                // Prevent body scroll
                document.body.style.overflow = 'hidden';
                
                // Focus first input if available
                setTimeout(() => {
                    const firstInput = modal.querySelector('input, select, textarea, button');
                    if (firstInput) {
                        firstInput.focus();
                    }
                }, 100);
                
                // Call modal-specific initialization if data provided
                if (data && typeof this.initializeModal === 'function') {
                    this.initializeModal(modalId, data);
                }
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Close modal
    close(result = null) {
        if (!this.isOpen) return;
        
        // Hide overlay
        this.overlay.classList.remove('active');
        this.isOpen = false;
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Hide current modal
        if (this.currentModal) {
            this.currentModal.style.display = 'none';
            
            // Get modal ID
            const modalId = this.currentModal.id;
            
            // Resolve callback if exists
            const callback = this.callbacks.get(modalId);
            if (callback) {
                callback.resolve(result);
                this.callbacks.delete(modalId);
            }
            
            this.currentModal = null;
        }
    }
    
    // Hide all modals
    hideAllModals() {
        const modals = this.overlay.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    // Confirm dialog
    confirm(title, message, options = {}) {
        return new Promise((resolve) => {
            const modal = this.createConfirmModal(title, message, options);
            document.body.appendChild(modal);
            
            const handleConfirm = () => {
                modal.remove();
                this.close();
                resolve(true);
            };
            
            const handleCancel = () => {
                modal.remove();
                this.close();
                resolve(false);
            };
            
            modal.querySelector('.confirm-btn').addEventListener('click', handleConfirm);
            modal.querySelector('.cancel-btn').addEventListener('click', handleCancel);
            
            // Show modal
            this.overlay.appendChild(modal);
            this.overlay.classList.add('active');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Focus confirm button
            setTimeout(() => {
                modal.querySelector('.confirm-btn').focus();
            }, 100);
        });
    }
    
    // Alert dialog
    alert(title, message, type = 'info') {
        return new Promise((resolve) => {
            const modal = this.createAlertModal(title, message, type);
            document.body.appendChild(modal);
            
            const handleOk = () => {
                modal.remove();
                this.close();
                resolve();
            };
            
            modal.querySelector('.ok-btn').addEventListener('click', handleOk);
            
            // Show modal
            this.overlay.appendChild(modal);
            this.overlay.classList.add('active');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Focus OK button
            setTimeout(() => {
                modal.querySelector('.ok-btn').focus();
            }, 100);
        });
    }
    
    // Prompt dialog
    prompt(title, message, defaultValue = '', options = {}) {
        return new Promise((resolve) => {
            const modal = this.createPromptModal(title, message, defaultValue, options);
            document.body.appendChild(modal);
            
            const input = modal.querySelector('.prompt-input');
            
            const handleConfirm = () => {
                const value = input.value.trim();
                modal.remove();
                this.close();
                resolve(value || null);
            };
            
            const handleCancel = () => {
                modal.remove();
                this.close();
                resolve(null);
            };
            
            modal.querySelector('.confirm-btn').addEventListener('click', handleConfirm);
            modal.querySelector('.cancel-btn').addEventListener('click', handleCancel);
            
            // Handle Enter key
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    handleConfirm();
                }
            });
            
            // Show modal
            this.overlay.appendChild(modal);
            this.overlay.classList.add('active');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Focus input
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);
        });
    }
    
    // Create confirm modal
    createConfirmModal(title, message, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal modal-sm';
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${title}</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary cancel-btn">${options.cancelText || 'ยกเลิก'}</button>
                <button class="btn btn-primary confirm-btn">${options.confirmText || 'ยืนยัน'}</button>
            </div>
        `;
        return modal;
    }
    
    // Create alert modal
    createAlertModal(title, message, type = 'info') {
        const typeClasses = {
            info: 'btn-primary',
            success: 'btn-success',
            warning: 'btn-warning',
            error: 'btn-error'
        };
        
        const modal = document.createElement('div');
        modal.className = 'modal modal-sm';
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${title}</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn ${typeClasses[type] || 'btn-primary'} ok-btn">ตกลง</button>
            </div>
        `;
        return modal;
    }
    
    // Create prompt modal
    createPromptModal(title, message, defaultValue = '', options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal modal-sm';
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${title}</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
                <input type="${options.type || 'text'}" 
                       class="prompt-input" 
                       value="${defaultValue}"
                       placeholder="${options.placeholder || ''}"
                       style="width: 100%; padding: var(--spacing-sm); border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); margin-top: var(--spacing-sm);">
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary cancel-btn">ยกเลิก</button>
                <button class="btn btn-primary confirm-btn">ตกลง</button>
            </div>
        `;
        return modal;
    }
    
    // Loading modal
    showLoading(message = 'กำลังโหลด...') {
        const modal = document.createElement('div');
        modal.className = 'modal modal-sm loading-modal';
        modal.innerHTML = `
            <div class="modal-body" style="text-align: center; padding: var(--spacing-xl);">
                <div class="futuristic-spinner" style="margin: 0 auto var(--spacing-lg);"></div>
                <p>${message}</p>
            </div>
        `;
        
        this.overlay.appendChild(modal);
        this.overlay.classList.add('active');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
        
        return {
            close: () => {
                modal.remove();
                this.close();
            },
            updateMessage: (newMessage) => {
                const messageEl = modal.querySelector('p');
                if (messageEl) {
                    messageEl.textContent = newMessage;
                }
            }
        };
    }
    
    // Get current modal data
    getCurrentModalData() {
        if (!this.currentModal) return null;
        
        const form = this.currentModal.querySelector('form');
        if (!form) return null;
        
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }
    
    // Set modal data
    setModalData(data) {
        if (!this.currentModal || !data) return;
        
        Object.keys(data).forEach(key => {
            const input = this.currentModal.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = Boolean(data[key]);
                } else {
                    input.value = data[key];
                }
            }
        });
    }
    
    // Validate modal form
    validateModalForm() {
        if (!this.currentModal) return true;
        
        const form = this.currentModal.querySelector('form');
        if (!form) return true;
        
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('error');
                isValid = false;
            } else {
                input.classList.remove('error');
            }
        });
        
        return isValid;
    }
    
    // Add modal event listener
    on(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        
        this.eventListeners.get(event).push(callback);
    }
    
    // Emit modal event
    emit(event, data = null) {
        if (!this.eventListeners || !this.eventListeners.has(event)) {
            return;
        }
        
        this.eventListeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Modal event callback error:', error);
            }
        });
    }
    
    // Destroy modal
    destroy() {
        if (this.overlay) {
            this.overlay.remove();
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Clear callbacks
        this.callbacks.clear();
        
        if (this.eventListeners) {
            this.eventListeners.clear();
        }
    }
}

// Create and export singleton instance
export const modal = new Modal();

export default Modal;