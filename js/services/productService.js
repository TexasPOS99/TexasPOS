// Product Service
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config.js';

export class ProductService {
    constructor() {
        this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
    
    // Get all products with categories and prices
    async getProducts(options = {}) {
        try {
            let query = this.supabase
                .from('v_products_with_prices')
                .select('*');
            
            // Apply filters
            if (options.categoryId) {
                query = query.eq('category_id', options.categoryId);
            }
            
            if (options.search) {
                query = query.or(`name.ilike.%${options.search}%,barcode.ilike.%${options.search}%`);
            }
            
            if (options.activeOnly !== false) {
                query = query.eq('is_active', true);
            }
            
            // Apply sorting
            const sortBy = options.sortBy || 'name';
            const sortOrder = options.sortOrder || 'asc';
            query = query.order(sortBy, { ascending: sortOrder === 'asc' });
            
            // Apply pagination
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || CONFIG.ITEMS_PER_PAGE) - 1);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Parse prices JSON for each product
            return (data || []).map(product => ({
                ...product,
                prices: product.prices ? JSON.parse(product.prices) : []
            }));
            
        } catch (error) {
            console.error('Failed to get products:', error);
            throw error;
        }
    }
    
    // Get single product by ID
    async getProduct(productId) {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select(`
                    *,
                    category:categories(id, name),
                    prices:product_prices(*)
                `)
                .eq('id', productId)
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to get product:', error);
            throw error;
        }
    }
    
    // Get product by barcode
    async getProductByBarcode(barcode) {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select(`
                    *,
                    category:categories(id, name),
                    prices:product_prices(*)
                `)
                .eq('barcode', barcode)
                .eq('is_active', true)
                .single();
            
            if (error) throw error;
            
            return data;
            
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
                const { data: existingProduct } = await this.supabase
                    .from('products')
                    .select('id')
                    .eq('barcode', productData.barcode)
                    .single();
                
                if (existingProduct) {
                    throw new Error('บาร์โค้ดนี้มีอยู่แล้ว');
                }
            }
            
            // Create product
            const { data, error } = await this.supabase
                .from('products')
                .insert([{
                    name: productData.name.trim(),
                    category_id: productData.category_id,
                    barcode: productData.barcode || null,
                    image_url: productData.image_url || null,
                    stock: productData.stock || 0,
                    min_stock: productData.min_stock || CONFIG.LOW_STOCK_THRESHOLD,
                    is_active: true
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to create product:', error);
            throw error;
        }
    }
    
    // Update product
    async updateProduct(productId, updates) {
        try {
            // Check if barcode is being updated and already exists
            if (updates.barcode) {
                const { data: existingProduct } = await this.supabase
                    .from('products')
                    .select('id')
                    .eq('barcode', updates.barcode)
                    .neq('id', productId)
                    .single();
                
                if (existingProduct) {
                    throw new Error('บาร์โค้ดนี้มีอยู่แล้ว');
                }
            }
            
            const { data, error } = await this.supabase
                .from('products')
                .update(updates)
                .eq('id', productId)
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to update product:', error);
            throw error;
        }
    }
    
    // Update product stock
    async updateStock(productId, newStock, changeType = 'adjustment', referenceId = null, employeeId = null, notes = null) {
        try {
            // Get current stock
            const { data: product, error: fetchError } = await this.supabase
                .from('products')
                .select('stock')
                .eq('id', productId)
                .single();
            
            if (fetchError) throw fetchError;
            
            const oldStock = product.stock;
            const stockChange = newStock - oldStock;
            
            // Update product stock
            const { error: updateError } = await this.supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', productId);
            
            if (updateError) throw updateError;
            
            // Record stock history
            if (employeeId) {
                await this.recordStockHistory({
                    product_id: productId,
                    change_type: changeType,
                    quantity_before: oldStock,
                    quantity_change: stockChange,
                    quantity_after: newStock,
                    reference_id: referenceId,
                    employee_id: employeeId,
                    notes: notes
                });
            }
            
            return { oldStock, newStock, stockChange };
            
        } catch (error) {
            console.error('Failed to update stock:', error);
            throw error;
        }
    }
    
    // Record stock history
    async recordStockHistory(historyData) {
        try {
            const { error } = await this.supabase
                .from('stock_history')
                .insert([historyData]);
            
            if (error) throw error;
            
        } catch (error) {
            console.error('Failed to record stock history:', error);
            throw error;
        }
    }
    
    // Get stock history for a product
    async getStockHistory(productId, options = {}) {
        try {
            let query = this.supabase
                .from('stock_history')
                .select(`
                    *,
                    employee:employees(name),
                    product:products(name)
                `)
                .eq('product_id', productId);
            
            // Apply date filter
            if (options.startDate) {
                query = query.gte('created_at', options.startDate);
            }
            
            if (options.endDate) {
                query = query.lte('created_at', options.endDate);
            }
            
            // Apply change type filter
            if (options.changeType) {
                query = query.eq('change_type', options.changeType);
            }
            
            // Sort by date (newest first)
            query = query.order('created_at', { ascending: false });
            
            // Apply pagination
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            return data || [];
            
        } catch (error) {
            console.error('Failed to get stock history:', error);
            throw error;
        }
    }
    
    // Get low stock products
    async getLowStockProducts() {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select(`
                    *,
                    category:categories(name)
                `)
                .lte('stock', 'min_stock')
                .eq('is_active', true)
                .order('stock', { ascending: true });
            
            if (error) throw error;
            
            return data || [];
            
        } catch (error) {
            console.error('Failed to get low stock products:', error);
            throw error;
        }
    }
    
    // Get categories
    async getCategories(activeOnly = true) {
        try {
            let query = this.supabase
                .from('categories')
                .select('*')
                .order('name');
            
            if (activeOnly) {
                query = query.eq('is_active', true);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            return data || [];
            
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
            const { data: existingCategory } = await this.supabase
                .from('categories')
                .select('id')
                .eq('code', categoryData.code)
                .single();
            
            if (existingCategory) {
                throw new Error('รหัสหมวดหมู่นี้มีอยู่แล้ว');
            }
            
            const { data, error } = await this.supabase
                .from('categories')
                .insert([{
                    code: categoryData.code.trim(),
                    name: categoryData.name.trim(),
                    description: categoryData.description || null,
                    is_active: true
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to create category:', error);
            throw error;
        }
    }
    
    // Get product prices
    async getProductPrices(productId) {
        try {
            const { data, error } = await this.supabase
                .from('product_prices')
                .select('*')
                .eq('product_id', productId)
                .eq('is_active', true)
                .order('is_default', { ascending: false })
                .order('price', { ascending: true });
            
            if (error) throw error;
            
            return data || [];
            
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
            
            // If this is set as default, unset other default prices
            if (priceData.is_default) {
                await this.supabase
                    .from('product_prices')
                    .update({ is_default: false })
                    .eq('product_id', priceData.product_id);
            }
            
            const { data, error } = await this.supabase
                .from('product_prices')
                .insert([{
                    product_id: priceData.product_id,
                    price: priceData.price,
                    label: priceData.label.trim(),
                    is_default: priceData.is_default || false,
                    is_active: true
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to add product price:', error);
            throw error;
        }
    }
    
    // Update product price
    async updateProductPrice(priceId, updates) {
        try {
            // If setting as default, unset other default prices for the same product
            if (updates.is_default) {
                const { data: price } = await this.supabase
                    .from('product_prices')
                    .select('product_id')
                    .eq('id', priceId)
                    .single();
                
                if (price) {
                    await this.supabase
                        .from('product_prices')
                        .update({ is_default: false })
                        .eq('product_id', price.product_id)
                        .neq('id', priceId);
                }
            }
            
            const { data, error } = await this.supabase
                .from('product_prices')
                .update(updates)
                .eq('id', priceId)
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to update product price:', error);
            throw error;
        }
    }
    
    // Delete product price
    async deleteProductPrice(priceId) {
        try {
            const { error } = await this.supabase
                .from('product_prices')
                .delete()
                .eq('id', priceId);
            
            if (error) throw error;
            
            return true;
            
        } catch (error) {
            console.error('Failed to delete product price:', error);
            throw error;
        }
    }
    
    // Search products
    async searchProducts(searchTerm, options = {}) {
        try {
            if (!searchTerm || searchTerm.trim().length < 2) {
                return [];
            }
            
            const term = searchTerm.trim();
            
            let query = this.supabase
                .from('v_products_with_prices')
                .select('*')
                .or(`name.ilike.%${term}%,barcode.ilike.%${term}%`)
                .eq('is_active', true);
            
            if (options.categoryId) {
                query = query.eq('category_id', options.categoryId);
            }
            
            query = query
                .order('name')
                .limit(options.limit || 20);
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Parse prices JSON for each product
            return (data || []).map(product => ({
                ...product,
                prices: product.prices ? JSON.parse(product.prices) : []
            }));
            
        } catch (error) {
            console.error('Failed to search products:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
export const productService = new ProductService();

export default ProductService;