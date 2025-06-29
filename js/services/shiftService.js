// Shift Service
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config.js';

export class ShiftService {
    constructor() {
        this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
    
    // Get current shift type based on time
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
    
    // Get shift info
    getShiftInfo(shiftType) {
        return CONFIG.SHIFTS[shiftType] || null;
    }
    
    // Start shift
    async startShift(employeeId, shiftType = null) {
        try {
            const currentShiftType = shiftType || this.getCurrentShiftType();
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            const startTime = now.toTimeString().split(' ')[0];
            
            // Check if shift already exists for today
            const { data: existingShift } = await this.supabase
                .from('shifts')
                .select('*')
                .eq('employee_id', employeeId)
                .eq('shift_date', today)
                .eq('shift_type', currentShiftType)
                .single();
            
            if (existingShift) {
                throw new Error('กะนี้ได้เริ่มแล้วในวันนี้');
            }
            
            // Create new shift
            const { data, error } = await this.supabase
                .from('shifts')
                .insert([{
                    shift_date: today,
                    shift_type: currentShiftType,
                    employee_id: employeeId,
                    start_time: startTime,
                    total_sales: 0,
                    cash_sales: 0,
                    transfer_sales: 0,
                    total_orders: 0
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to start shift:', error);
            throw error;
        }
    }
    
    // End shift
    async endShift(shiftId, notes = null) {
        try {
            const now = new Date();
            const endTime = now.toTimeString().split(' ')[0];
            
            const { data, error } = await this.supabase
                .from('shifts')
                .update({
                    end_time: endTime,
                    notes: notes
                })
                .eq('id', shiftId)
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to end shift:', error);
            throw error;
        }
    }
    
    // Get current shift for employee
    async getCurrentShift(employeeId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const currentShiftType = this.getCurrentShiftType();
            
            const { data, error } = await this.supabase
                .from('shifts')
                .select(`
                    *,
                    employee:employees(name)
                `)
                .eq('employee_id', employeeId)
                .eq('shift_date', today)
                .eq('shift_type', currentShiftType)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }
            
            return data || null;
            
        } catch (error) {
            console.error('Failed to get current shift:', error);
            throw error;
        }
    }
    
    // Get shifts for date range
    async getShifts(options = {}) {
        try {
            let query = this.supabase
                .from('shifts')
                .select(`
                    *,
                    employee:employees(name)
                `);
            
            // Apply filters
            if (options.employeeId) {
                query = query.eq('employee_id', options.employeeId);
            }
            
            if (options.startDate) {
                query = query.gte('shift_date', options.startDate);
            }
            
            if (options.endDate) {
                query = query.lte('shift_date', options.endDate);
            }
            
            if (options.shiftType) {
                query = query.eq('shift_type', options.shiftType);
            }
            
            // Apply sorting
            query = query.order('shift_date', { ascending: false })
                         .order('shift_type', { ascending: true });
            
            // Apply pagination
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            return data || [];
            
        } catch (error) {
            console.error('Failed to get shifts:', error);
            throw error;
        }
    }
    
    // Get shift summary
    async getShiftSummary(shiftId) {
        try {
            // Get shift details
            const { data: shift, error: shiftError } = await this.supabase
                .from('shifts')
                .select(`
                    *,
                    employee:employees(name)
                `)
                .eq('id', shiftId)
                .single();
            
            if (shiftError) throw shiftError;
            
            // Get sales for this shift
            const { data: sales, error: salesError } = await this.supabase
                .from('sales')
                .select(`
                    *,
                    items:sale_items(*)
                `)
                .eq('employee_id', shift.employee_id)
                .eq('sale_date', shift.shift_date)
                .eq('shift_type', shift.shift_type);
            
            if (salesError) throw salesError;
            
            // Calculate detailed summary
            const summary = {
                shift: shift,
                sales: sales || [],
                totalSales: shift.total_sales || 0,
                cashSales: shift.cash_sales || 0,
                transferSales: shift.transfer_sales || 0,
                totalOrders: shift.total_orders || 0,
                averageOrderValue: 0,
                itemsSold: 0,
                topProducts: [],
                hourlyBreakdown: {}
            };
            
            // Calculate additional metrics
            if (summary.totalOrders > 0) {
                summary.averageOrderValue = summary.totalSales / summary.totalOrders;
            }
            
            // Calculate items sold and top products
            const productSales = {};
            
            sales.forEach(sale => {
                const hour = new Date(`${sale.sale_date}T${sale.sale_time}`).getHours();
                
                // Hourly breakdown
                if (!summary.hourlyBreakdown[hour]) {
                    summary.hourlyBreakdown[hour] = {
                        sales: 0,
                        orders: 0
                    };
                }
                summary.hourlyBreakdown[hour].sales += parseFloat(sale.total_amount);
                summary.hourlyBreakdown[hour].orders += 1;
                
                // Product sales
                sale.items.forEach(item => {
                    summary.itemsSold += item.quantity;
                    
                    if (!productSales[item.product_name]) {
                        productSales[item.product_name] = {
                            name: item.product_name,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    
                    productSales[item.product_name].quantity += item.quantity;
                    productSales[item.product_name].revenue += parseFloat(item.subtotal);
                });
            });
            
            // Get top 5 products by quantity
            summary.topProducts = Object.values(productSales)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);
            
            return summary;
            
        } catch (error) {
            console.error('Failed to get shift summary:', error);
            throw error;
        }
    }
    
    // Get daily shift summary
    async getDailyShiftSummary(date = null, employeeId = null) {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            
            let query = this.supabase
                .from('shifts')
                .select(`
                    *,
                    employee:employees(name)
                `)
                .eq('shift_date', targetDate);
            
            if (employeeId) {
                query = query.eq('employee_id', employeeId);
            }
            
            query = query.order('shift_type');
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Calculate totals
            const summary = {
                date: targetDate,
                shifts: data || [],
                totalSales: 0,
                totalCash: 0,
                totalTransfer: 0,
                totalOrders: 0,
                shiftBreakdown: {
                    morning: { sales: 0, orders: 0, employees: [] },
                    afternoon: { sales: 0, orders: 0, employees: [] },
                    night: { sales: 0, orders: 0, employees: [] }
                }
            };
            
            data.forEach(shift => {
                summary.totalSales += parseFloat(shift.total_sales || 0);
                summary.totalCash += parseFloat(shift.cash_sales || 0);
                summary.totalTransfer += parseFloat(shift.transfer_sales || 0);
                summary.totalOrders += parseInt(shift.total_orders || 0);
                
                const shiftType = shift.shift_type;
                if (summary.shiftBreakdown[shiftType]) {
                    summary.shiftBreakdown[shiftType].sales += parseFloat(shift.total_sales || 0);
                    summary.shiftBreakdown[shiftType].orders += parseInt(shift.total_orders || 0);
                    summary.shiftBreakdown[shiftType].employees.push({
                        id: shift.employee_id,
                        name: shift.employee.name,
                        sales: shift.total_sales,
                        orders: shift.total_orders
                    });
                }
            });
            
            return summary;
            
        } catch (error) {
            console.error('Failed to get daily shift summary:', error);
            throw error;
        }
    }
    
    // Update shift totals (called by database trigger)
    async updateShiftTotals(employeeId, shiftDate, shiftType) {
        try {
            // Get sales totals for the shift
            const { data: salesSummary, error } = await this.supabase
                .rpc('get_shift_sales_summary', {
                    p_employee_id: employeeId,
                    p_shift_date: shiftDate,
                    p_shift_type: shiftType
                });
            
            if (error) throw error;
            
            const summary = salesSummary[0] || {
                total_sales: 0,
                cash_sales: 0,
                transfer_sales: 0,
                total_orders: 0
            };
            
            // Update shift record
            const { data, error: updateError } = await this.supabase
                .from('shifts')
                .update({
                    total_sales: summary.total_sales,
                    cash_sales: summary.cash_sales,
                    transfer_sales: summary.transfer_sales,
                    total_orders: summary.total_orders
                })
                .eq('employee_id', employeeId)
                .eq('shift_date', shiftDate)
                .eq('shift_type', shiftType)
                .select()
                .single();
            
            if (updateError) throw updateError;
            
            return data;
            
        } catch (error) {
            console.error('Failed to update shift totals:', error);
            throw error;
        }
    }
    
    // Get shift performance comparison
    async getShiftPerformanceComparison(options = {}) {
        try {
            const endDate = options.endDate || new Date().toISOString().split('T')[0];
            const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            const shifts = await this.getShifts({
                startDate,
                endDate,
                employeeId: options.employeeId
            });
            
            // Group by shift type
            const comparison = {
                morning: { totalSales: 0, totalOrders: 0, avgSales: 0, avgOrders: 0, count: 0 },
                afternoon: { totalSales: 0, totalOrders: 0, avgSales: 0, avgOrders: 0, count: 0 },
                night: { totalSales: 0, totalOrders: 0, avgSales: 0, avgOrders: 0, count: 0 }
            };
            
            shifts.forEach(shift => {
                const shiftType = shift.shift_type;
                if (comparison[shiftType]) {
                    comparison[shiftType].totalSales += parseFloat(shift.total_sales || 0);
                    comparison[shiftType].totalOrders += parseInt(shift.total_orders || 0);
                    comparison[shiftType].count += 1;
                }
            });
            
            // Calculate averages
            Object.keys(comparison).forEach(shiftType => {
                const data = comparison[shiftType];
                if (data.count > 0) {
                    data.avgSales = data.totalSales / data.count;
                    data.avgOrders = data.totalOrders / data.count;
                }
            });
            
            return comparison;
            
        } catch (error) {
            console.error('Failed to get shift performance comparison:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
export const shiftService = new ShiftService();

export default ShiftService;