// Product Service - Fixed for hardcoded data
import { CONFIG } from '../config.js';

export class ProductService {
    constructor() {
        this.products = [];
        this.categories = [];
        this.initializeData();
    }
    
    // Initialize hardcoded data
    initializeData() {
        // Categories
        this.categories = [
            { id: 1, code: 'CIG', name: 'บุหรี่', description: 'บุหรี่ทุกชนิด', is_active: true },
            { id: 2, code: 'MED', name: 'ยาน้ำแก้ไอ', description: 'ยาน้ำแก้ไอทุกชนิด', is_active: true },
            { id: 3, code: 'DRINK', name: 'น้ำดิบ / ผสม', description: 'เครื่องดื่มทุกชนิด', is_active: true },
            { id: 4, code: 'OTHER', name: 'อื่นๆ', description: 'สินค้าอื่นๆ', is_active: true }
        ];
        
        // Products with prices
        this.products = [
            // บุหรี่
            {
                id: 1,
                name: 'บุหรี่40',
                category_id: 1,
                category_name: 'บุหรี่',
                barcode: 'CIG001',
                image_url: null,
                stock: 50,
                min_stock: 10,
                is_active: true,
                prices: [
                    { id: 1, product_id: 1, price: 40, label: 'ซองละ', is_default: true, is_active: true }
                ]
            },
            {
                id: 2,
                name: 'บุหรี่50',
                category_id: 1,
                category_name: 'บุหรี่',
                barcode: 'CIG002',
                image_url: null,
                stock: 30,
                min_stock: 10,
                is_active: true,
                prices: [
                    { id: 2, product_id: 2, price: 50, label: 'ซองละ', is_default: true, is_active: true }
                ]
            },
            {
                id: 3,
                name: 'บุหรี่60',
                category_id: 1,
                category_name: 'บุหรี่',
                barcode: 'CIG003',
                image_url: null,
                stock: 25,
                min_stock: 10,
                is_active: true,
                prices: [
                    { id: 3, product_id: 3, price: 60, label: 'ซองละ', is_default: true, is_active: true }
                ]
            },
            
            // ยาน้ำแก้ไอ
            {
                id: 4,
                name: 'ยาฝาเงิน',
                category_id: 2,
                category_name: 'ยาน้ำแก้ไอ',
                barcode: 'MED001',
                image_url: null,
                stock: 20,
                min_stock: 5,
                is_active: true,
                prices: [
                    { id: 4, product_id: 4, price: 60, label: 'ขวดละ', is_default: true, is_active: true }
                ]
            },
            {
                id: 5,
                name: 'ยาฝาแดง',
                category_id: 2,
                category_name: 'ยาน้ำแก้ไอ',
                barcode: 'MED002',
                image_url: null,
                stock: 15,
                min_stock: 5,
                is_active: true,
                prices: [
                    { id: 5, product_id: 5, price: 70, label: 'ขวดละ', is_default: true, is_active: true }
                ]
            },
            
            // น้ำดิบ / ผสม
            {
                id: 6,
                name: 'น้ำดิบ',
                category_id: 3,
                category_name: 'น้ำดิบ / ผสม',
                barcode: 'DRK001',
                image_url: null,
                stock: 40,
                min_stock: 10,
                is_active: true,
                prices: [
                    { id: 6, product_id: 6, price: 40, label: 'ขวดละ', is_default: true, is_active: true },
                    { id: 7, product_id: 6, price: 25, label: 'ขวดเล็ก', is_default: false, is_active: true }
                ]
            },
            {
                id: 7,
                name: 'น้ำผสมฝาเงิน',
                category_id: 3,
                category_name: 'น้ำดิบ / ผสม',
                barcode: 'DRK002',
                image_url: null,
                stock: 35,
                min_stock: 10,
                is_active: true,
                prices: [
                    { id: 8, product_id: 7, price: 80, label: 'ขวดละ', is_default: true, is_active: true },
                    { id: 9, product_id: 7, price: 50, label: 'ขวดเล็ก', is_default: false, is_active: true },
                    { id: 10, product_id: 7, price: 60, label: 'ขวดกลาง', is_default: false, is_active: true },
                    { id: 11, product_id: 7, price: 90, label: 'ขวดใหญ่', is_default: false, is_active: true }
                ]
            },
            {
                id: 8,
                name: 'น้ำผสมฝาแดง',
                category_id: 3,
                category_name: 'น้ำดิบ / ผสม',
                barcode: 'DRK003',
                image_url: null,
                stock: 30,
                min_stock: 10,
                is_active: true,
                prices: [
                    { id: 12, product_id: 8, price: 90, label: 'ขวดละ', is_default: true, is_active: true },
                    { id: 13, product_id: 8, price: 60, label: 'ขวดเล็ก', is_default: false, is_active: true }
                ]
            },
            
            // อื่นๆ
            {
                id: 9,
                name: 'น้ำตาลสด',
                category_id: 4,
                category_name: 'อื่นๆ',
                barcode: 'OTH001',
                image_url: null,
                stock: 60,
                min_stock: 20,
                is_active: true,
                prices: [
                    { id: 14, product_id: 9, price: 12, label: 'ขวดละ', is_default: true, is_active: true }
                ]
            },
            {
                id: 10,
                name: 'โค้ก',
                category_id: 4,
                category_name: 'อื่นๆ',
                barcode: 'OTH002',
                image_url: null,
                stock: 45,
                min_stock: 15,
                is_active: true,
                prices: [
                    { id: 15, product_id: 10, price: 17, label: 'ขวดละ', is_default: true, is_active: true }
                ]
            },
            {
                id: 11,
                name: 'อิชิตัน',
                category_id: 4,
                category_name: 'อื่นๆ',
                barcode: 'OTH003',
                image_url: null,
                stock: 35,
                min_stock: 10,
                is_active: true,
                prices: [
                    { id: 16, product_id: 11, price: 10, label: 'ขวดละ', is_default: true, is_active: true }
                ]
            },
            {
                id: 12,
                name: 'ใบขีด',
                category_id: 4,
                category_name: 'อื่นๆ',
                barcode: 'OTH004',
                image_url: null,
                stock: 100,
                min_stock: 30,
                is_active: true,
                prices: [
                    { id: 17, product_id: 12, price: 15, label: 'ใบละ', is_default: true, is_active: true }
                ]
            },
            {
                id: 13,
                name: 'ใบครึ่งโล',
                category_id: 4,
                category_name: 'อื่นๆ',
                barcode: 'OTH005',
                image_url: null,
                stock: 25,
                min_stock: 5,
                is_active: true,
                prices: [
                    { id: 18, product_id: 13, price: 60, label: 'ใบละ', is_default: true, is_active: true }
                ]
            },
            {
                id: 14,
                name: 'ใบกิโล',
                category_id: 4,
                category_name: 'อื่นๆ',
                barcode: 'OTH006',
                image_url: null,
                stock: 15,
                min_stock: 3,
                is_active: true,
                prices: [
                    { id: 19, product_id: 14, price: 99, label: 'ใบละ', is_default: true, is_active: true }
                ]
            },
            {
                id: 15,
                name: 'น้ำแข็ง',
                category_id: 4,
                category_name: 'อื่นๆ',
                barcode: 'OTH007',
                image_url: null,
                stock: 50,
                min_stock: 10,
                is_active: true,
                prices: [
                    { id: 20, product_id: 15, price: 5, label: 'ถุงเล็ก', is_default: true, is_active: true },
                    { id: 21, product_id: 15, price: 10, label: 'ถุงกลาง', is_default: false, is_active: true },
                    { id: 22, product_id: 15, price: 20, label: 'ถุงใหญ่', is_default: false, is_active: true }
                ]
            }
        ];
    }
    
    // Get all products with categories and prices
    async getProducts(options = {}) {
        try {
            let filtered = [...this.products];
            
            // Apply filters
            if (options.categoryId) {
                filtered = filtered.filter(product => product.category_id == options.categoryId);
            }
            
            if (options.search) {
                const term = options.search.toLowerCase();
                filtered = filtered.filter(product => 
                    product.name.toLowerCase().includes(term) ||
                    (product.barcode && product.barcode.toLowerCase().includes(term))
                );
            }
            
            if (options.activeOnly !== false) {
                filtered = filtered.filter(product => product.is_active);
            }
            
            // Apply sorting
            const sortBy = options.sortBy || 'name';
            const sortOrder = options.sortOrder || 'asc';
            
            filtered.sort((a, b) => {
                let aVal = a[sortBy];
                let bVal = b[sortBy];
                
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }
                
                if (sortOrder === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
            
            // Apply pagination
            if (options.limit) {
                const offset = options.offset || 0;
                filtered = filtered.slice(offset, offset + options.limit);
            }
            
            return filtered;
            
        } catch (error) {
            console.error('Failed to get products:', error);
            throw error;
        }
    }
    
    // Get single product by ID
    async getProduct(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (!product) {
                throw new Error('ไม่พบสินค้า');
            }
            
            return {
                ...product,
                category: { id: product.category_id, name: product.category_name },
                prices: product.prices || []
            };
            
        } catch (error) {
            console.error('Failed to get product:', error);
            throw error;
        }
    }
    
    // Get product by barcode
    async getProductByBarcode(barcode) {
        try {
            const product = this.products.find(p => p.barcode === barcode && p.is_active);
            if (!product) {
                throw new Error('ไม่พบสินค้า');
            }
            
            return {
                ...product,
                category: { id: product.category_id, name: product.category_name },
                prices: product.prices || []
            };
            
        } catch (error) {
            console.error('Failed to get product by barcode:', error);
            throw error;
        }
    }
    
    // Create new product
    async createProduct(productData) {
        try {
            // Validate required fields
            if (!productData.name || !productData.category_id) {
                throw new Error('ชื่อสินค้าและหมวดหมู่เป็นข้อมูลที่จำเป็น');
            }
            
            // Check if barcode already exists (if provided)
            if (productData.barcode) {
                const existingProduct = this.products.find(p => p.barcode === productData.barcode);
                if (existingProduct) {
                    throw new Error('บาร์โค้ดนี้มีอยู่แล้ว');
                }
            }
            
            // Find category
            const category = this.categories.find(c => c.id == productData.category_id);
            if (!category) {
                throw new Error('ไม่พบหมวดหมู่ที่เลือก');
            }
            
            // Generate new ID
            const newId = Math.max(...this.products.map(p => p.id)) + 1;
            
            // Create product
            const newProduct = {
                id: newId,
                name: productData.name.trim(),
                category_id: productData.category_id,
                category_name: category.name,
                barcode: productData.barcode || null,
                image_url: productData.image_url || null,
                stock: productData.stock || 0,
                min_stock: productData.min_stock || CONFIG.LOW_STOCK_THRESHOLD,
                is_active: true,
                prices: []
            };
            
            // Add to products array
            this.products.push(newProduct);
            
            return newProduct;
            
        } catch (error) {
            console.error('Failed to create product:', error);
            throw error;
        }
    }
    
    // Update product
    async updateProduct(productId, updates) {
        try {
            const productIndex = this.products.findIndex(p => p.id === productId);
            if (productIndex === -1) {
                throw new Error('ไม่พบสินค้า');
            }
            
            // Check if barcode is being updated and already exists
            if (updates.barcode) {
                const existingProduct = this.products.find(p => p.barcode === updates.barcode && p.id !== productId);
                if (existingProduct) {
                    throw new Error('บาร์โค้ดนี้มีอยู่แล้ว');
                }
            }
            
            // Update category name if category_id is changed
            if (updates.category_id) {
                const category = this.categories.find(c => c.id == updates.category_id);
                if (category) {
                    updates.category_name = category.name;
                }
            }
            
            // Update product
            this.products[productIndex] = { ...this.products[productIndex], ...updates };
            
            return this.products[productIndex];
            
        } catch (error) {
            console.error('Failed to update product:', error);
            throw error;
        }
    }
    
    // Update product stock
    async updateStock(productId, newStock, changeType = 'adjustment', referenceId = null, employeeId = null, notes = null) {
        try {
            const productIndex = this.products.findIndex(p => p.id === productId);
            if (productIndex === -1) {
                throw new Error('ไม่พบสินค้า');
            }
            
            const oldStock = this.products[productIndex].stock;
            const stockChange = newStock - oldStock;
            
            // Update product stock
            this.products[productIndex].stock = newStock;
            
            return { oldStock, newStock, stockChange };
            
        } catch (error) {
            console.error('Failed to update stock:', error);
            throw error;
        }
    }
    
    // Get categories
    async getCategories(activeOnly = true) {
        try {
            let filtered = [...this.categories];
            
            if (activeOnly) {
                filtered = filtered.filter(category => category.is_active);
            }
            
            return filtered.sort((a, b) => a.name.localeCompare(b.name));
            
        } catch (error) {
            console.error('Failed to get categories:', error);
            throw error;
        }
    }
    
    // Create category
    async createCategory(categoryData) {
        try {
            if (!categoryData.name || !categoryData.code) {
                throw new Error('ชื่อหมวดหมู่และรหัสเป็นข้อมูลที่จำเป็น');
            }
            
            // Check if code already exists
            const existingCategory = this.categories.find(c => c.code === categoryData.code);
            if (existingCategory) {
                throw new Error('รหัสหมวดหมู่นี้มีอยู่แล้ว');
            }
            
            // Generate new ID
            const newId = Math.max(...this.categories.map(c => c.id)) + 1;
            
            const newCategory = {
                id: newId,
                code: categoryData.code.trim(),
                name: categoryData.name.trim(),
                description: categoryData.description || null,
                is_active: true
            };
            
            this.categories.push(newCategory);
            
            return newCategory;
            
        } catch (error) {
            console.error('Failed to create category:', error);
            throw error;
        }
    }
    
    // Get product prices
    async getProductPrices(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (!product) {
                throw new Error('ไม่พบสินค้า');
            }
            
            return product.prices || [];
            
        } catch (error) {
            console.error('Failed to get product prices:', error);
            throw error;
        }
    }
    
    // Add product price
    async addProductPrice(priceData) {
        try {
            if (!priceData.product_id || !priceData.price || !priceData.label) {
                throw new Error('ข้อมูลราคาไม่ครบถ้วน');
            }
            
            const productIndex = this.products.findIndex(p => p.id === priceData.product_id);
            if (productIndex === -1) {
                throw new Error('ไม่พบสินค้า');
            }
            
            // If this is set as default, unset other default prices
            if (priceData.is_default) {
                this.products[productIndex].prices.forEach(price => {
                    price.is_default = false;
                });
            }
            
            // Generate new price ID
            const allPrices = this.products.flatMap(p => p.prices || []);
            const newPriceId = allPrices.length > 0 ? Math.max(...allPrices.map(p => p.id)) + 1 : 1;
            
            const newPrice = {
                id: newPriceId,
                product_id: priceData.product_id,
                price: priceData.price,
                label: priceData.label.trim(),
                is_default: priceData.is_default || false,
                is_active: true
            };
            
            this.products[productIndex].prices.push(newPrice);
            
            return newPrice;
            
        } catch (error) {
            console.error('Failed to add product price:', error);
            throw error;
        }
    }
    
    // Search products
    async searchProducts(searchTerm, options = {}) {
        try {
            if (!searchTerm || searchTerm.trim().length < 2) {
                return [];
            }
            
            return await this.getProducts({
                ...options,
                search: searchTerm.trim(),
                limit: options.limit || 20
            });
            
        } catch (error) {
            console.error('Failed to search products:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
export const productService = new ProductService();

export default ProductService;