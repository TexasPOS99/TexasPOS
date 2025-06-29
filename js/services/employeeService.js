// Employee Service
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config.js';

export class EmployeeService {
    constructor() {
        this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
    
    // Get all employees
    async getEmployees(options = {}) {
        try {
            let query = this.supabase
                .from('employees')
                .select('*');
            
            // Apply filters
            if (options.activeOnly !== false) {
                query = query.eq('is_active', true);
            }
            
            if (options.role) {
                query = query.eq('role', options.role);
            }
            
            if (options.search) {
                query = query.ilike('name', `%${options.search}%`);
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
            
            return data || [];
            
        } catch (error) {
            console.error('Failed to get employees:', error);
            throw error;
        }
    }
    
    // Get single employee
    async getEmployee(employeeId) {
        try {
            const { data, error } = await this.supabase
                .from('employees')
                .select('*')
                .eq('id', employeeId)
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to get employee:', error);
            throw error;
        }
    }
    
    // Get employee by PIN
    async getEmployeeByPin(pin) {
        try {
            const { data, error } = await this.supabase
                .from('employees')
                .select('*')
                .eq('pin', pin)
                .eq('is_active', true)
                .maybeSingle();
            
            if (error) {
                console.error('Database error:', error);
                throw error;
            }
            
            return data; // Will be null if no employee found
            
        } catch (error) {
            console.error('Failed to get employee by PIN:', error);
            throw error;
        }
    }
    
    // Create employee
    async createEmployee(employeeData) {
        try {
            // Validate required fields
            if (!employeeData.name || !employeeData.pin || !employeeData.role) {
                throw new Error('ข้อมูลไม่ครบถ้วน');
            }
            
            // Validate PIN
            if (employeeData.pin.length !== CONFIG.VALIDATION.PIN_LENGTH || !/^\d+$/.test(employeeData.pin)) {
                throw new Error('รหัส PIN ต้องเป็นตัวเลข 4 หลัก');
            }
            
            // Validate role
            if (!['admin', 'employee'].includes(employeeData.role)) {
                throw new Error('ตำแหน่งไม่ถูกต้อง');
            }
            
            // Check if PIN already exists - use maybeSingle() for graceful handling
            const existingEmployee = await this.getEmployeeByPin(employeeData.pin);
            if (existingEmployee) {
                throw new Error('รหัส PIN นี้มีอยู่แล้ว');
            }
            
            // Create employee
            const { data, error } = await this.supabase
                .from('employees')
                .insert([{
                    name: employeeData.name.trim(),
                    pin: employeeData.pin,
                    role: employeeData.role,
                    is_active: true
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to create employee:', error);
            throw error;
        }
    }
    
    // Update employee
    async updateEmployee(employeeId, updates) {
        try {
            // Validate updates
            const allowedFields = ['name', 'role', 'is_active'];
            const filteredUpdates = {};
            
            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    filteredUpdates[field] = updates[field];
                }
            });
            
            // Validate role if being updated
            if (filteredUpdates.role && !['admin', 'employee'].includes(filteredUpdates.role)) {
                throw new Error('ตำแหน่งไม่ถูกต้อง');
            }
            
            // Trim name if being updated
            if (filteredUpdates.name) {
                filteredUpdates.name = filteredUpdates.name.trim();
                if (!filteredUpdates.name) {
                    throw new Error('ชื่อพนักงานไม่สามารถเป็นค่าว่างได้');
                }
            }
            
            const { data, error } = await this.supabase
                .from('employees')
                .update(filteredUpdates)
                .eq('id', employeeId)
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to update employee:', error);
            throw error;
        }
    }
    
    // Change employee PIN
    async changeEmployeePin(employeeId, newPin) {
        try {
            // Validate PIN
            if (newPin.length !== CONFIG.VALIDATION.PIN_LENGTH || !/^\d+$/.test(newPin)) {
                throw new Error('รหัส PIN ต้องเป็นตัวเลข 4 หลัก');
            }
            
            // Check if PIN already exists - use maybeSingle() for graceful handling
            const { data: existingEmployee } = await this.supabase
                .from('employees')
                .select('id')
                .eq('pin', newPin)
                .neq('id', employeeId)
                .maybeSingle();
            
            if (existingEmployee) {
                throw new Error('รหัส PIN นี้มีอยู่แล้ว');
            }
            
            // Update PIN
            const { data, error } = await this.supabase
                .from('employees')
                .update({ pin: newPin })
                .eq('id', employeeId)
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to change employee PIN:', error);
            throw error;
        }
    }
    
    // Toggle employee active status
    async toggleEmployeeStatus(employeeId) {
        try {
            // Get current status
            const employee = await this.getEmployee(employeeId);
            
            // Toggle status
            const { data, error } = await this.supabase
                .from('employees')
                .update({ is_active: !employee.is_active })
                .eq('id', employeeId)
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to toggle employee status:', error);
            throw error;
        }
    }
    
    // Delete employee (soft delete by setting inactive)
    async deleteEmployee(employeeId, deletedBy, reason = null) {
        try {
            // Get employee data for history
            const employee = await this.getEmployee(employeeId);
            
            // Record deletion in history
            const { error: historyError } = await this.supabase
                .from('deletion_history')
                .insert([{
                    table_name: 'employees',
                    record_id: employeeId,
                    record_data: employee,
                    deleted_by: deletedBy,
                    reason: reason
                }]);
            
            if (historyError) throw historyError;
            
            // Soft delete by setting inactive
            const { data, error } = await this.supabase
                .from('employees')
                .update({ is_active: false })
                .eq('id', employeeId)
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('Failed to delete employee:', error);
            throw error;
        }
    }
    
    // Get employee performance
    async getEmployeePerformance(employeeId, options = {}) {
        try {
            const endDate = options.endDate || new Date().toISOString().split('T')[0];
            const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            // Get sales data
            const { data: sales, error: salesError } = await this.supabase
                .from('sales')
                .select('total_amount, payment_method, shift_type, sale_date, created_at')
                .eq('employee_id', employeeId)
                .gte('sale_date', startDate)
                .lte('sale_date', endDate);
            
            if (salesError) throw salesError;
            
            // Get shifts data
            const { data: shifts, error: shiftsError } = await this.supabase
                .from('shifts')
                .select('*')
                .eq('employee_id', employeeId)
                .gte('shift_date', startDate)
                .lte('shift_date', endDate);
            
            if (shiftsError) throw shiftsError;
            
            // Calculate performance metrics
            const performance = {
                totalSales: 0,
                totalOrders: sales.length,
                averageOrderValue: 0,
                totalShifts: shifts.length,
                salesByPaymentMethod: {
                    cash: 0,
                    transfer: 0
                },
                salesByShift: {
                    morning: 0,
                    afternoon: 0,
                    night: 0
                },
                dailyAverages: {
                    sales: 0,
                    orders: 0
                },
                bestDay: null,
                worstDay: null
            };
            
            // Calculate totals
            const dailySales = {};
            
            sales.forEach(sale => {
                const amount = parseFloat(sale.total_amount);
                performance.totalSales += amount;
                
                // Payment method breakdown
                performance.salesByPaymentMethod[sale.payment_method] += amount;
                
                // Shift breakdown
                performance.salesByShift[sale.shift_type] += amount;
                
                // Daily breakdown
                const date = sale.sale_date;
                if (!dailySales[date]) {
                    dailySales[date] = { sales: 0, orders: 0 };
                }
                dailySales[date].sales += amount;
                dailySales[date].orders += 1;
            });
            
            // Calculate averages
            if (performance.totalOrders > 0) {
                performance.averageOrderValue = performance.totalSales / performance.totalOrders;
            }
            
            const daysWorked = Object.keys(dailySales).length;
            if (daysWorked > 0) {
                performance.dailyAverages.sales = performance.totalSales / daysWorked;
                performance.dailyAverages.orders = performance.totalOrders / daysWorked;
                
                // Find best and worst days
                const sortedDays = Object.entries(dailySales).sort((a, b) => b[1].sales - a[1].sales);
                if (sortedDays.length > 0) {
                    performance.bestDay = {
                        date: sortedDays[0][0],
                        sales: sortedDays[0][1].sales,
                        orders: sortedDays[0][1].orders
                    };
                    performance.worstDay = {
                        date: sortedDays[sortedDays.length - 1][0],
                        sales: sortedDays[sortedDays.length - 1][1].sales,
                        orders: sortedDays[sortedDays.length - 1][1].orders
                    };
                }
            }
            
            return performance;
            
        } catch (error) {
            console.error('Failed to get employee performance:', error);
            throw error;
        }
    }
    
    // Get employee attendance
    async getEmployeeAttendance(employeeId, options = {}) {
        try {
            const endDate = options.endDate || new Date().toISOString().split('T')[0];
            const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            const { data: shifts, error } = await this.supabase
                .from('shifts')
                .select('*')
                .eq('employee_id', employeeId)
                .gte('shift_date', startDate)
                .lte('shift_date', endDate)
                .order('shift_date', { ascending: false });
            
            if (error) throw error;
            
            // Calculate attendance metrics
            const attendance = {
                totalShifts: shifts.length,
                completedShifts: shifts.filter(s => s.end_time).length,
                incompleteShifts: shifts.filter(s => !s.end_time).length,
                shiftsByType: {
                    morning: shifts.filter(s => s.shift_type === 'morning').length,
                    afternoon: shifts.filter(s => s.shift_type === 'afternoon').length,
                    night: shifts.filter(s => s.shift_type === 'night').length
                },
                averageShiftDuration: 0,
                shifts: shifts
            };
            
            // Calculate average shift duration
            const completedShifts = shifts.filter(s => s.start_time && s.end_time);
            if (completedShifts.length > 0) {
                const totalDuration = completedShifts.reduce((sum, shift) => {
                    const start = new Date(`1970-01-01T${shift.start_time}`);
                    const end = new Date(`1970-01-01T${shift.end_time}`);
                    let duration = end.getTime() - start.getTime();
                    
                    // Handle overnight shifts
                    if (duration < 0) {
                        duration += 24 * 60 * 60 * 1000;
                    }
                    
                    return sum + duration;
                }, 0);
                
                attendance.averageShiftDuration = totalDuration / completedShifts.length / (1000 * 60 * 60); // in hours
            }
            
            return attendance;
            
        } catch (error) {
            console.error('Failed to get employee attendance:', error);
            throw error;
        }
    }
    
    // Get all employees summary
    async getEmployeesSummary(options = {}) {
        try {
            const employees = await this.getEmployees(options);
            
            const summary = {
                total: employees.length,
                active: employees.filter(e => e.is_active).length,
                inactive: employees.filter(e => !e.is_active).length,
                admins: employees.filter(e => e.role === 'admin').length,
                employees: employees.filter(e => e.role === 'employee').length,
                recentlyCreated: employees.filter(e => {
                    const created = new Date(e.created_at);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return created > weekAgo;
                }).length
            };
            
            return summary;
            
        } catch (error) {
            console.error('Failed to get employees summary:', error);
            throw error;
        }
    }
    
    // Search employees
    async searchEmployees(searchTerm, options = {}) {
        try {
            if (!searchTerm || searchTerm.trim().length < 2) {
                return [];
            }
            
            return await this.getEmployees({
                ...options,
                search: searchTerm.trim(),
                limit: options.limit || 10
            });
            
        } catch (error) {
            console.error('Failed to search employees:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
export const employeeService = new EmployeeService();

export default EmployeeService;