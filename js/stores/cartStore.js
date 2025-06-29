// Cart Store
import { CONFIG } from '../config.js';

export class CartStore {
    constructor() {
        this.items = new Map();
        this.listeners = new Map();
        this.storageKey = CONFIG.STORAGE_KEYS.CART;
        
        this.init();
    }
    
    async init() {
        // Load cart from localStorage
        this.loadFromStorage();
    }
    
    // Add item to cart
    addItem(product, price, quantity = 1) {
        try {
            // Validate inputs
            if (!product || !product.id) {
                throw new Error('Invalid product');
            }
            
            if (!price || price.price <= 0) {
                throw new Error('Invalid price');
            }
            
            if (quantity <= 0) {
                throw new Error('Invalid quantity');
            }
            
            // Check stock availability
            if (product.stock < quantity) {
                throw new Error('สินค้าในสต็อกไม่เพียงพอ');
            }
            
            // Create cart item key (product_id + price_id)
            const itemKey = `${product.id}_${price.id}`;
            
            // Check if item already exists
            if (this.items.has(itemKey)) {
                const existingItem = this.items.get(itemKey);
                const newQuantity = existingItem.quantity + quantity;
                
                // Check total quantity against stock
                if (newQuantity > product.stock) {
                    throw new Error('จำนวนรวมเกินสต็อกที่มี');
                }
                
                existingItem.quantity = newQuantity;
                existingItem.subtotal = existingItem.price * newQuantity;
            } else {
                // Add new item
                const cartItem = {
                    id: itemKey,
                    product_id: product.id,
                    name: product.name,
                    category: product.category_name || '',
                    image_url: product.image_url,
                    price: price.price,
                    price_label: price.label,
                    price_id: price.id,
                    quantity: quantity,
                    subtotal: price.price * quantity,
                    stock: product.stock,
                    addedAt: new Date().toISOString()
                };
                
                this.items.set(itemKey, cartItem);
            }
            
            // Save to storage
            this.saveToStorage();
            
            // Emit events
            this.emit('itemAdded', this.items.get(itemKey));
            this.emit('cartUpdated');
            
            return this.items.get(itemKey);
            
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    
    // Remove item from cart
    removeItem(itemKey) {
        try {
            if (!this.items.has(itemKey)) {
                throw new Error('Item not found in cart');
            }
            
            const item = this.items.get(itemKey);
            this.items.delete(itemKey);
            
            // Save to storage
            this.saveToStorage();
            
            // Emit events
            this.emit('itemRemoved', item);
            this.emit('cartUpdated');
            
            return item;
            
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    
    // Update item quantity
    updateQuantity(itemKey, quantity) {
        try {
            if (!this.items.has(itemKey)) {
                throw new Error('Item not found in cart');
            }
            
            if (quantity <= 0) {
                return this.removeItem(itemKey);
            }
            
            const item = this.items.get(itemKey);
            
            // Check stock availability
            if (quantity > item.stock) {
                throw new Error('จำนวนเกินสต็อกที่มี');
            }
            
            const oldQuantity = item.quantity;
            item.quantity = quantity;
            item.subtotal = item.price * quantity;
            
            // Save to storage
            this.saveToStorage();
            
            // Emit events
            this.emit('quantityUpdated', { item, oldQuantity, newQuantity: quantity });
            this.emit('cartUpdated');
            
            return item;
            
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    
    // Get all items
    getItems() {
        return Array.from(this.items.values());
    }
    
    // Get item by key
    getItem(itemKey) {
        return this.items.get(itemKey);
    }
    
    // Get item count
    getItemCount() {
        return Array.from(this.items.values()).reduce((sum, item) => sum + item.quantity, 0);
    }
    
    // Get unique product count
    getUniqueItemCount() {
        return this.items.size;
    }
    
    // Get total amount
    getTotalAmount() {
        return Array.from(this.items.values()).reduce((sum, item) => sum + item.subtotal, 0);
    }
    
    // Check if cart is empty
    isEmpty() {
        return this.items.size === 0;
    }
    
    // Clear cart
    clear() {
        const itemCount = this.items.size;
        this.items.clear();
        
        // Save to storage
        this.saveToStorage();
        
        // Emit events
        this.emit('cartCleared', itemCount);
        this.emit('cartUpdated');
    }
    
    // Check if product is in cart
    hasProduct(productId, priceId = null) {
        if (priceId) {
            const itemKey = `${productId}_${priceId}`;
            return this.items.has(itemKey);
        }
        
        // Check if any variant of the product is in cart
        return Array.from(this.items.keys()).some(key => key.startsWith(`${productId}_`));
    }
    
    // Get product quantity in cart
    getProductQuantity(productId, priceId = null) {
        if (priceId) {
            const itemKey = `${productId}_${priceId}`;
            const item = this.items.get(itemKey);
            return item ? item.quantity : 0;
        }
        
        // Get total quantity for all variants of the product
        return Array.from(this.items.values())
            .filter(item => item.product_id === productId)
            .reduce((sum, item) => sum + item.quantity, 0);
    }
    
    // Validate cart against current stock
    async validateCart(productService) {
        const validationErrors = [];
        const itemsToUpdate = [];
        const itemsToRemove = [];
        
        for (const [itemKey, item] of this.items) {
            try {
                // Get current product data
                const product = await productService.getProduct(item.product_id);
                
                if (!product || !product.is_active) {
                    itemsToRemove.push(itemKey);
                    validationErrors.push(`${item.name} ไม่พร้อมขายแล้ว`);
                    continue;
                }
                
                // Check stock
                if (product.stock < item.quantity) {
                    if (product.stock === 0) {
                        itemsToRemove.push(itemKey);
                        validationErrors.push(`${item.name} หมดสต็อก`);
                    } else {
                        itemsToUpdate.push({
                            itemKey,
                            newQuantity: product.stock,
                            oldQuantity: item.quantity
                        });
                        validationErrors.push(`${item.name} เหลือเพียง ${product.stock} ชิ้น`);
                    }
                }
                
                // Update stock info
                item.stock = product.stock;
                
            } catch (error) {
                console.error(`Failed to validate item ${itemKey}:`, error);
                validationErrors.push(`ไม่สามารถตรวจสอบ ${item.name} ได้`);
            }
        }
        
        // Apply updates
        itemsToRemove.forEach(itemKey => this.removeItem(itemKey));
        itemsToUpdate.forEach(({ itemKey, newQuantity }) => {
            this.updateQuantity(itemKey, newQuantity);
        });
        
        return {
            isValid: validationErrors.length === 0,
            errors: validationErrors,
            updatedItems: itemsToUpdate.length,
            removedItems: itemsToRemove.length
        };
    }
    
    // Get cart summary
    getSummary() {
        const items = this.getItems();
        
        return {
            itemCount: this.getItemCount(),
            uniqueItemCount: this.getUniqueItemCount(),
            totalAmount: this.getTotalAmount(),
            isEmpty: this.isEmpty(),
            items: items,
            categories: [...new Set(items.map(item => item.category))],
            averageItemPrice: items.length > 0 ? this.getTotalAmount() / this.getItemCount() : 0
        };
    }
    
    // Save to localStorage
    saveToStorage() {
        try {
            const cartData = {
                items: Array.from(this.items.entries()),
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(cartData));
        } catch (error) {
            console.error('Failed to save cart to storage:', error);
        }
    }
    
    // Load from localStorage
    loadFromStorage() {
        try {
            const cartData = localStorage.getItem(this.storageKey);
            if (!cartData) return;
            
            const parsed = JSON.parse(cartData);
            
            // Check if cart data is not too old (24 hours)
            const timestamp = new Date(parsed.timestamp);
            const now = new Date();
            const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                // Clear old cart data
                localStorage.removeItem(this.storageKey);
                return;
            }
            
            // Restore items
            if (parsed.items && Array.isArray(parsed.items)) {
                this.items = new Map(parsed.items);
                this.emit('cartLoaded');
                this.emit('cartUpdated');
            }
            
        } catch (error) {
            console.error('Failed to load cart from storage:', error);
            // Clear corrupted data
            localStorage.removeItem(this.storageKey);
        }
    }
    
    // Export cart data
    exportData() {
        return {
            items: this.getItems(),
            summary: this.getSummary(),
            timestamp: new Date().toISOString()
        };
    }
    
    // Import cart data
    importData(data) {
        try {
            if (!data || !data.items) {
                throw new Error('Invalid cart data');
            }
            
            this.clear();
            
            data.items.forEach(item => {
                const itemKey = `${item.product_id}_${item.price_id}`;
                this.items.set(itemKey, item);
            });
            
            this.saveToStorage();
            this.emit('cartImported');
            this.emit('cartUpdated');
            
        } catch (error) {
            console.error('Failed to import cart data:', error);
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
                    console.error(`Error in cart store event callback for ${event}:`, error);
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
        this.clear();
        this.clearListeners();
        localStorage.removeItem(this.storageKey);
    }
}

// Create and export singleton instance
export const cartStore = new CartStore();

export default CartStore;