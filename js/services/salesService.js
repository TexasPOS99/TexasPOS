// Sales Service
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config.js';

export class SalesService {
    constructor() {
        this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
    
    // Generate sale number
    generateSaleNumber() {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const time = now.getTime().toString().slice(-6);
        
        return `S${year}${month}${day}${time}`;
    }
    
    // Get current shift type
    getCurrentShiftType() {
        const now = new Date();
        const hour = now.getHours();
        
        if (hour >= 6 && hour < 14) {
            return 'morning';
        } else if (hour >= 14 && hour < 22) {
            return 'afternoon';
        } else {
            return 'night';
        }
    }
    
    // Create sale
    async createSale(saleData) {
        try {
            // Validate sale data
            if (!saleData.items || saleData.items.length === 0) {
                throw new Error('ไม่มีสินค้าในการขาย');
            }
            
            if (!saleData.employee_id) {
                throw new Error('ไม่พบข้อมูลพนักงาน');
            }
            
            if (!saleData.payment_method) {
                throw new Error('กรุณาเลือกวิธีการชำระเงิน');
            }
            
            // Calculate total amount
            const totalAmount = saleData.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
            
            // Validate cash payment
            if (saleData.payment_method === 'cash') {
                if (!saleData.cash_received || saleData.cash_received < totalAmount) {
                    throw new Error('จำนวนเงินที่รับไม่เพียงพอ');
                }
            }
            
            // Generate sale number
            const saleNumber = this.generateSaleNumber();
            
            // Get current date and time
            const now = new Date();
            const saleDate = now.toISOString().split('T')[0];
            const saleTime = now.toTimeString().split(' ')[0];
            const shiftType = this.getCurrentShiftType();
            
            // Calculate change
            const changeAmount = saleData.payment_method === 'cash' 
                ? saleData.cash_received - totalAmount 
                : 0;
            
            // Create sale record
            const { data: sale, error: saleError } = await this.supabase
                .from('sales')
                .insert([{
                    sale_number: saleNumber,
                    employee_id: saleData.employee_id,
                    total_amount: totalAmount,
                    payment_method: saleData.payment_method,
                    cash_received: saleData.cash_received || null,
                    change_amount: changeAmount,
                    shift_type: shiftType,
                    sale_date: saleDate,
                    sale_time: saleTime,
                    notes: saleData.notes || null
                }])
                .select()
                .single();
            
            if (saleError) throw saleError;
            
            // Create sale items
            const saleItems = saleData.items.map(item => ({
                sale_id: sale.id,
                product_id: item.product_id,
                product_name: item.name,
                price: item.price,
                price_label: item.price_label || 'ชิ้นละ',
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            }));
            
            const { error: itemsError } = await this.supabase
                .from('sale_items')
                .insert(saleItems);
            
            if (itemsError) throw itemsError;
            
            // Return complete sale data
            return {
                ...sale,
                items: saleItems,
                change_amount: changeAmount
            };
            
        } catch (error) {
            console.error('Failed to create sale:', error);
            throw error;
        }
    }
    
    // Get sales history
    async getSales(options = {}) {
        try {
            let query = this.supabase
                .from('sales')
                .select(`
                    *,
                    employee:employees(name),
                    items:sale_items(*)
                `);
            
            // Apply filters
            if (options.employeeId) {
                query = query.eq('employee_id', options.employeeId);
            }
            
            if (options.startDate) {
                query = query.gte('sale_date', options.startDate);
            }
            
            if (options.endDate) {
                query = query.lte('sale_date', options.endDate);
            }
            
            if (options.shiftType) {
                query = query.eq('shift_type', options.shiftType);
            }
            
            if (options.paymentMethod) {
                query = query.eq('payment_method', options.paymentMethod);
            }
            
            // Apply sorting
            const sortBy = options.sortBy || 'created_at';
            const sortOrder = options.sortOrder || 'desc';
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
            
            return data || [];
            
        } catch (error) {
            console.error('Failed to get sales:', error);
            throw error;
        }
    }
    
    // Get single sale
    async getSale(saleId) {
        try {
            const { data, error } = await this.supabase
                .from('sales')
                .select(`
                    *,
                    employee:employees(name),
                    items:sale_items(*)
                `)
                .eq('id', saleId)
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to get sale:', error);
            throw error;
        }
    }
    
    // Get sales summary
    async getSalesSummary(options = {}) {
        try {
            let query = this.supabase
                .from('sales')
                .select('total_amount, payment_method, shift_type, sale_date');
            
            // Apply filters
            if (options.employeeId) {
                query = query.eq('employee_id', options.employeeId);
            }
            
            if (options.startDate) {
                query = query.gte('sale_date', options.startDate);
            }
            
            if (options.endDate) {
                query = query.lte('sale_date', options.endDate);
            }
            
            if (options.shiftType) {
                query = query.eq('shift_type', options.shiftType);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Calculate summary
            const summary = {
                totalSales: 0,
                totalOrders: data.length,
                cashSales: 0,
                transferSales: 0,
                averageOrderValue: 0,
                salesByShift: {
                    morning: 0,
                    afternoon: 0,
                    night: 0
                },
                salesByDate: {}
            };
            
            data.forEach(sale => {
                const amount = parseFloat(sale.total_amount);
                summary.totalSales += amount;
                
                if (sale.payment_method === 'cash') {
                    summary.cashSales += amount;
                } else if (sale.payment_method === 'transfer') {
                    summary.transferSales += amount;
                }
                
                // Group by shift
                if (summary.salesByShift[sale.shift_type] !== undefined) {
                    summary.salesByShift[sale.shift_type] += amount;
                }
                
                // Group by date
                if (!summary.salesByDate[sale.sale_date]) {
                    summary.salesByDate[sale.sale_date] = 0;
                }
                summary.salesByDate[sale.sale_date] += amount;
            });
            
            // Calculate average order value
            if (summary.totalOrders > 0) {
                summary.averageOrderValue = summary.totalSales / summary.totalOrders;
            }
            
            return summary;
            
        } catch (error) {
            console.error('Failed to get sales summary:', error);
            throw error;
        }
    }
    
    // Get daily sales report
    async getDailySalesReport(date = null) {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            
            const { data, error } = await this.supabase
                .from('v_daily_sales_report')
                .select('*')
                .eq('sale_date', targetDate)
                .order('shift_type');
            
            if (error) throw error;
            
            return data || [];
            
        } catch (error) {
            console.error('Failed to get daily sales report:', error);
            throw error;
        }
    }
    
    // Get top selling products
    async getTopSellingProducts(options = {}) {
        try {
            let query = this.supabase
                .from('v_top_selling_products')
                .select('*');
            
            // Apply date filter
            if (options.startDate || options.endDate) {
                // Note: This would require joining with sales table in the view
                // For now, we'll get all data and filter client-side if needed
            }
            
            // Apply limit
            const limit = options.limit || 10;
            query = query
                .order('total_sold', { ascending: false })
                .limit(limit);
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            return data || [];
            
        } catch (error) {
            console.error('Failed to get top selling products:', error);
            throw error;
        }
    }
    
    // Get sales by time period
    async getSalesByPeriod(period = 'day', options = {}) {
        try {
            const now = new Date();
            let startDate, endDate;
            
            switch (period) {
                case 'day':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + 1);
                    break;
                case 'week':
                    const dayOfWeek = now.getDay();
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - dayOfWeek);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + 7);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear() + 1, 0, 1);
                    break;
                default:
                    throw new Error('Invalid period');
            }
            
            return await this.getSalesSummary({
                ...options,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            });
            
        } catch (error) {
            console.error('Failed to get sales by period:', error);
            throw error;
        }
    }
    
    // Cancel sale (admin only)
    async cancelSale(saleId, reason, employeeId) {
        try {
            // Get sale details
            const sale = await this.getSale(saleId);
            if (!sale) {
                throw new Error('ไม่พบข้อมูลการขาย');
            }
            
            // Check if sale is recent (within 24 hours)
            const saleTime = new Date(sale.created_at);
            const now = new Date();
            const timeDiff = now.getTime() - saleTime.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                throw new Error('ไม่สามารถยกเลิกการขายที่เกิน 24 ชั่วโมงได้');
            }
            
            // Record cancellation in deletion history
            const { error: historyError } = await this.supabase
                .from('deletion_history')
                .insert([{
                    table_name: 'sales',
                    record_id: saleId,
                    record_data: sale,
                    deleted_by: employeeId,
                    reason: reason
                }]);
            
            if (historyError) throw historyError;
            
            // Delete sale (this will cascade to sale_items)
            const { error: deleteError } = await this.supabase
                .from('sales')
                .delete()
                .eq('id', saleId);
            
            if (deleteError) throw deleteError;
            
            return true;
            
        } catch (error) {
            console.error('Failed to cancel sale:', error);
            throw error;
        }
    }
    
    // Get payment method statistics
    async getPaymentMethodStats(options = {}) {
        try {
            const summary = await this.getSalesSummary(options);
            
            const total = summary.totalSales;
            const cash = summary.cashSales;
            const transfer = summary.transferSales;
            
            return {
                cash: {
                    amount: cash,
                    percentage: total > 0 ? (cash / total) * 100 : 0
                },
                transfer: {
                    amount: transfer,
                    percentage: total > 0 ? (transfer / total) * 100 : 0
                },
                total: total
            };
            
        } catch (error) {
            console.error('Failed to get payment method stats:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
export const salesService = new SalesService();

export default SalesService;