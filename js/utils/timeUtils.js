// Time Utilities
import { CONFIG } from '../config.js';

export class TimeUtils {
    // Format date to Thai locale
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('th-TH', { ...defaultOptions, ...options });
    }
    
    // Format time to Thai locale
    static formatTime(date, options = {}) {
        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        const dateObj = new Date(date);
        return dateObj.toLocaleTimeString('th-TH', { ...defaultOptions, ...options });
    }
    
    // Format datetime to Thai locale
    static formatDateTime(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        const dateObj = new Date(date);
        return dateObj.toLocaleString('th-TH', { ...defaultOptions, ...options });
    }
    
    // Get relative time (e.g., "2 hours ago")
    static getRelativeTime(date) {
        const now = new Date();
        const targetDate = new Date(date);
        const diffMs = now.getTime() - targetDate.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSeconds < 60) {
            return 'เมื่อสักครู่';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} นาทีที่แล้ว`;
        } else if (diffHours < 24) {
            return `${diffHours} ชั่วโมงที่แล้ว`;
        } else if (diffDays < 7) {
            return `${diffDays} วันที่แล้ว`;
        } else {
            return this.formatDate(targetDate, { month: 'short', day: 'numeric' });
        }
    }
    
    // Get current shift type based on time
    static getCurrentShiftType() {
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
    
    // Get shift name in Thai
    static getShiftName(shiftType) {
        const shiftNames = {
            morning: 'กะเช้า',
            afternoon: 'กะบ่าย',
            night: 'กะดึก'
        };
        
        return shiftNames[shiftType] || shiftType;
    }
    
    // Get shift time range
    static getShiftTimeRange(shiftType) {
        const shifts = CONFIG.SHIFTS;
        const shift = shifts[shiftType];
        
        if (!shift) return null;
        
        return {
            start: shift.start,
            end: shift.end,
            name: shift.name
        };
    }
    
    // Check if time is within shift
    static isTimeInShift(time, shiftType) {
        const shiftRange = this.getShiftTimeRange(shiftType);
        if (!shiftRange) return false;
        
        const timeObj = new Date(`1970-01-01T${time}`);
        const startTime = new Date(`1970-01-01T${shiftRange.start}`);
        const endTime = new Date(`1970-01-01T${shiftRange.end}`);
        
        // Handle overnight shifts
        if (endTime < startTime) {
            return timeObj >= startTime || timeObj <= endTime;
        }
        
        return timeObj >= startTime && timeObj <= endTime;
    }
    
    // Calculate duration between two times
    static calculateDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        let duration = end.getTime() - start.getTime();
        
        // Handle negative duration (overnight)
        if (duration < 0) {
            duration += 24 * 60 * 60 * 1000;
        }
        
        return duration; // in milliseconds
    }
    
    // Format duration to human readable
    static formatDuration(durationMs) {
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
        
        if (hours > 0) {
            return `${hours} ชั่วโมง ${minutes} นาที`;
        } else if (minutes > 0) {
            return `${minutes} นาที ${seconds} วินาที`;
        } else {
            return `${seconds} วินาที`;
        }
    }
    
    // Get start of day
    static getStartOfDay(date = new Date()) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        return startOfDay;
    }
    
    // Get end of day
    static getEndOfDay(date = new Date()) {
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return endOfDay;
    }
    
    // Get start of week (Monday)
    static getStartOfWeek(date = new Date()) {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    }
    
    // Get end of week (Sunday)
    static getEndOfWeek(date = new Date()) {
        const endOfWeek = new Date(date);
        const day = endOfWeek.getDay();
        const diff = endOfWeek.getDate() - day + (day === 0 ? 0 : 7);
        endOfWeek.setDate(diff);
        endOfWeek.setHours(23, 59, 59, 999);
        return endOfWeek;
    }
    
    // Get start of month
    static getStartOfMonth(date = new Date()) {
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        return startOfMonth;
    }
    
    // Get end of month
    static getEndOfMonth(date = new Date()) {
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return endOfMonth;
    }
    
    // Get start of year
    static getStartOfYear(date = new Date()) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        return startOfYear;
    }
    
    // Get end of year
    static getEndOfYear(date = new Date()) {
        const endOfYear = new Date(date.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        return endOfYear;
    }
    
    // Add days to date
    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    // Add hours to date
    static addHours(date, hours) {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }
    
    // Add minutes to date
    static addMinutes(date, minutes) {
        const result = new Date(date);
        result.setMinutes(result.getMinutes() + minutes);
        return result;
    }
    
    // Check if date is today
    static isToday(date) {
        const today = new Date();
        const targetDate = new Date(date);
        
        return today.getDate() === targetDate.getDate() &&
               today.getMonth() === targetDate.getMonth() &&
               today.getFullYear() === targetDate.getFullYear();
    }
    
    // Check if date is yesterday
    static isYesterday(date) {
        const yesterday = this.addDays(new Date(), -1);
        const targetDate = new Date(date);
        
        return yesterday.getDate() === targetDate.getDate() &&
               yesterday.getMonth() === targetDate.getMonth() &&
               yesterday.getFullYear() === targetDate.getFullYear();
    }
    
    // Check if date is this week
    static isThisWeek(date) {
        const startOfWeek = this.getStartOfWeek();
        const endOfWeek = this.getEndOfWeek();
        const targetDate = new Date(date);
        
        return targetDate >= startOfWeek && targetDate <= endOfWeek;
    }
    
    // Check if date is this month
    static isThisMonth(date) {
        const today = new Date();
        const targetDate = new Date(date);
        
        return today.getMonth() === targetDate.getMonth() &&
               today.getFullYear() === targetDate.getFullYear();
    }
    
    // Get date range for period
    static getDateRangeForPeriod(period) {
        const now = new Date();
        
        switch (period) {
            case 'today':
                return {
                    start: this.getStartOfDay(now),
                    end: this.getEndOfDay(now)
                };
            case 'yesterday':
                const yesterday = this.addDays(now, -1);
                return {
                    start: this.getStartOfDay(yesterday),
                    end: this.getEndOfDay(yesterday)
                };
            case 'this_week':
                return {
                    start: this.getStartOfWeek(now),
                    end: this.getEndOfWeek(now)
                };
            case 'last_week':
                const lastWeekStart = this.addDays(this.getStartOfWeek(now), -7);
                const lastWeekEnd = this.addDays(this.getEndOfWeek(now), -7);
                return {
                    start: lastWeekStart,
                    end: lastWeekEnd
                };
            case 'this_month':
                return {
                    start: this.getStartOfMonth(now),
                    end: this.getEndOfMonth(now)
                };
            case 'last_month':
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return {
                    start: this.getStartOfMonth(lastMonth),
                    end: this.getEndOfMonth(lastMonth)
                };
            case 'this_year':
                return {
                    start: this.getStartOfYear(now),
                    end: this.getEndOfYear(now)
                };
            case 'last_7_days':
                return {
                    start: this.getStartOfDay(this.addDays(now, -6)),
                    end: this.getEndOfDay(now)
                };
            case 'last_30_days':
                return {
                    start: this.getStartOfDay(this.addDays(now, -29)),
                    end: this.getEndOfDay(now)
                };
            default:
                return {
                    start: this.getStartOfDay(now),
                    end: this.getEndOfDay(now)
                };
        }
    }
    
    // Format date for input[type="date"]
    static formatDateForInput(date) {
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    // Format time for input[type="time"]
    static formatTimeForInput(date) {
        const dateObj = new Date(date);
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        
        return `${hours}:${minutes}`;
    }
    
    // Parse date from input[type="date"]
    static parseDateFromInput(dateString) {
        if (!dateString) return null;
        
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    
    // Parse time from input[type="time"]
    static parseTimeFromInput(timeString) {
        if (!timeString) return null;
        
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }
    
    // Get timezone offset in hours
    static getTimezoneOffset() {
        return new Date().getTimezoneOffset() / -60;
    }
    
    // Convert to UTC
    static toUTC(date) {
        const dateObj = new Date(date);
        return new Date(dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000));
    }
    
    // Convert from UTC
    static fromUTC(date) {
        const dateObj = new Date(date);
        return new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
    }
    
    // Get business days between two dates
    static getBusinessDaysBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let businessDays = 0;
        
        const currentDate = new Date(start);
        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
                businessDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return businessDays;
    }
    
    // Check if date is weekend
    static isWeekend(date) {
        const dayOfWeek = new Date(date).getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    }
    
    // Get next business day
    static getNextBusinessDay(date) {
        let nextDay = this.addDays(date, 1);
        while (this.isWeekend(nextDay)) {
            nextDay = this.addDays(nextDay, 1);
        }
        return nextDay;
    }
    
    // Get previous business day
    static getPreviousBusinessDay(date) {
        let prevDay = this.addDays(date, -1);
        while (this.isWeekend(prevDay)) {
            prevDay = this.addDays(prevDay, -1);
        }
        return prevDay;
    }
}

// Export utility functions
export const {
    formatDate,
    formatTime,
    formatDateTime,
    getRelativeTime,
    getCurrentShiftType,
    getShiftName,
    getShiftTimeRange,
    isTimeInShift,
    calculateDuration,
    formatDuration,
    getStartOfDay,
    getEndOfDay,
    getStartOfWeek,
    getEndOfWeek,
    getStartOfMonth,
    getEndOfMonth,
    getStartOfYear,
    getEndOfYear,
    addDays,
    addHours,
    addMinutes,
    isToday,
    isYesterday,
    isThisWeek,
    isThisMonth,
    getDateRangeForPeriod,
    formatDateForInput,
    formatTimeForInput,
    parseDateFromInput,
    parseTimeFromInput,
    getTimezoneOffset,
    toUTC,
    fromUTC,
    getBusinessDaysBetween,
    isWeekend,
    getNextBusinessDay,
    getPreviousBusinessDay
} = TimeUtils;

export default TimeUtils;