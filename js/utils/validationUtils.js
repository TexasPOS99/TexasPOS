// Validation Utilities
import { CONFIG } from '../config.js';

export class ValidationUtils {
    // Validate PIN
    static validatePin(pin) {
        if (!pin) {
            return { isValid: false, message: 'กรุณาใส่รหัส PIN' };
        }
        
        if (typeof pin !== 'string') {
            pin = String(pin);
        }
        
        if (pin.length !== CONFIG.VALIDATION.PIN_LENGTH) {
            return { isValid: false, message: `รหัส PIN ต้องมี ${CONFIG.VALIDATION.PIN_LENGTH} หลัก` };
        }
        
        if (!/^\d+$/.test(pin)) {
            return { isValid: false, message: 'รหัส PIN ต้องเป็นตัวเลขเท่านั้น' };
        }
        
        return { isValid: true, message: '' };
    }
    
    // Validate email
    static validateEmail(email) {
        if (!email) {
            return { isValid: false, message: 'กรุณาใส่อีเมล' };
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' };
        }
        
        return { isValid: true, message: '' };
    }
    
    // Validate phone number (Thai format)
    static validatePhone(phone) {
        if (!phone) {
            return { isValid: false, message: 'กรุณาใส่หมายเลขโทรศัพท์' };
        }
        
        // Remove spaces and dashes
        const cleanPhone = phone.replace(/[\s-]/g, '');
        
        // Thai mobile number patterns
        const mobileRegex = /^(06|08|09)\d{8}$/;
        // Thai landline patterns
        const landlineRegex = /^0[2-7]\d{7,8}$/;
        
        if (!mobileRegex.test(cleanPhone) && !landlineRegex.test(cleanPhone)) {
            return { isValid: false, message: 'รูปแบบหมายเลขโทรศัพท์ไม่ถูกต้อง' };
        }
        
        return { isValid: true, message: '' };
    }
    
    // Validate price
    static validatePrice(price) {
        if (price === null || price === undefined || price === '') {
            return { isValid: false, message: 'กรุณาใส่ราคา' };
        }
        
        const numPrice = parseFloat(price);
        
        if (isNaN(numPrice)) {
            return { isValid: false, message: 'ราคาต้องเป็นตัวเลข' };
        }
        
        if (numPrice < CONFIG.VALIDATION.MIN_PRICE) {
            return { isValid: false, message: `ราคาต้องมากกว่า ${CONFIG.VALIDATION.MIN_PRICE}` };
        }
        
        if (numPrice > CONFIG.VALIDATION.MAX_PRICE) {
            return { isValid: false, message: `ราคาต้องน้อยกว่า ${CONFIG.VALIDATION.MAX_PRICE.toLocaleString()}` };
        }
        
        return { isValid: true, message: '', value: numPrice };
    }
    
    // Validate stock quantity
    static validateStock(stock) {
        if (stock === null || stock === undefined || stock === '') {
            return { isValid: false, message: 'กรุณาใส่จำนวนสต็อก' };
        }
        
        const numStock = parseInt(stock);
        
        if (isNaN(numStock)) {
            return { isValid: false, message: 'จำนวนสต็อกต้องเป็นตัวเลข' };
        }
        
        if (numStock < CONFIG.VALIDATION.MIN_STOCK) {
            return { isValid: false, message: `จำนวนสต็อกต้องมากกว่าหรือเท่ากับ ${CONFIG.VALIDATION.MIN_STOCK}` };
        }
        
        if (numStock > CONFIG.VALIDATION.MAX_STOCK) {
            return { isValid: false, message: `จำนวนสต็อกต้องน้อยกว่า ${CONFIG.VALIDATION.MAX_STOCK.toLocaleString()}` };
        }
        
        return { isValid: true, message: '', value: numStock };
    }
    
    // Validate product name
    static validateProductName(name) {
        if (!name || !name.trim()) {
            return { isValid: false, message: 'กรุณาใส่ชื่อสินค้า' };
        }
        
        const trimmedName = name.trim();
        
        if (trimmedName.length > CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH) {
            return { isValid: false, message: `ชื่อสินค้าต้องไม่เกิน ${CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH} ตัวอักษร` };
        }
        
        return { isValid: true, message: '', value: trimmedName };
    }
    
    // Validate employee name
    static validateEmployeeName(name) {
        if (!name || !name.trim()) {
            return { isValid: false, message: 'กรุณาใส่ชื่อพนักงาน' };
        }
        
        const trimmedName = name.trim();
        
        if (trimmedName.length > CONFIG.VALIDATION.MAX_EMPLOYEE_NAME_LENGTH) {
            return { isValid: false, message: `ชื่อพนักงานต้องไม่เกิน ${CONFIG.VALIDATION.MAX_EMPLOYEE_NAME_LENGTH} ตัวอักษร` };
        }
        
        return { isValid: true, message: '', value: trimmedName };
    }
    
    // Validate barcode
    static validateBarcode(barcode) {
        if (!barcode) {
            return { isValid: true, message: '', value: null }; // Barcode is optional
        }
        
        const trimmedBarcode = barcode.trim();
        
        if (trimmedBarcode.length === 0) {
            return { isValid: true, message: '', value: null };
        }
        
        // Basic barcode validation (alphanumeric, 6-50 characters)
        if (!/^[a-zA-Z0-9]{6,50}$/.test(trimmedBarcode)) {
            return { isValid: false, message: 'บาร์โค้ดต้องเป็นตัวอักษรและตัวเลข 6-50 ตัวอักษร' };
        }
        
        return { isValid: true, message: '', value: trimmedBarcode };
    }
    
    // Validate URL
    static validateUrl(url) {
        if (!url) {
            return { isValid: true, message: '', value: null }; // URL is optional
        }
        
        const trimmedUrl = url.trim();
        
        if (trimmedUrl.length === 0) {
            return { isValid: true, message: '', value: null };
        }
        
        try {
            new URL(trimmedUrl);
            return { isValid: true, message: '', value: trimmedUrl };
        } catch {
            return { isValid: false, message: 'รูปแบบ URL ไม่ถูกต้อง' };
        }
    }
    
    // Validate required field
    static validateRequired(value, fieldName = 'ฟิลด์นี้') {
        if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
            return { isValid: false, message: `${fieldName}เป็นข้อมูลที่จำเป็น` };
        }
        
        return { isValid: true, message: '' };
    }
    
    // Validate number range
    static validateNumberRange(value, min, max, fieldName = 'ค่า') {
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            return { isValid: false, message: `${fieldName}ต้องเป็นตัวเลข` };
        }
        
        if (min !== null && num < min) {
            return { isValid: false, message: `${fieldName}ต้องมากกว่าหรือเท่ากับ ${min}` };
        }
        
        if (max !== null && num > max) {
            return { isValid: false, message: `${fieldName}ต้องน้อยกว่าหรือเท่ากับ ${max}` };
        }
        
        return { isValid: true, message: '', value: num };
    }
    
    // Validate string length
    static validateStringLength(value, minLength = 0, maxLength = null, fieldName = 'ข้อความ') {
        if (!value) value = '';
        
        const length = value.length;
        
        if (length < minLength) {
            return { isValid: false, message: `${fieldName}ต้องมีอย่างน้อย ${minLength} ตัวอักษร` };
        }
        
        if (maxLength !== null && length > maxLength) {
            return { isValid: false, message: `${fieldName}ต้องไม่เกิน ${maxLength} ตัวอักษร` };
        }
        
        return { isValid: true, message: '', value: value };
    }
    
    // Validate date
    static validateDate(date, fieldName = 'วันที่') {
        if (!date) {
            return { isValid: false, message: `กรุณาเลือก${fieldName}` };
        }
        
        const dateObj = new Date(date);
        
        if (isNaN(dateObj.getTime())) {
            return { isValid: false, message: `${fieldName}ไม่ถูกต้อง` };
        }
        
        return { isValid: true, message: '', value: dateObj };
    }
    
    // Validate date range
    static validateDateRange(startDate, endDate) {
        const startValidation = this.validateDate(startDate, 'วันที่เริ่มต้น');
        if (!startValidation.isValid) {
            return startValidation;
        }
        
        const endValidation = this.validateDate(endDate, 'วันที่สิ้นสุด');
        if (!endValidation.isValid) {
            return endValidation;
        }
        
        if (startValidation.value > endValidation.value) {
            return { isValid: false, message: 'วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด' };
        }
        
        return { isValid: true, message: '' };
    }
    
    // Validate payment amount
    static validatePaymentAmount(received, total) {
        const receivedValidation = this.validatePrice(received);
        if (!receivedValidation.isValid) {
            return { isValid: false, message: 'จำนวนเงินที่รับไม่ถูกต้อง' };
        }
        
        const totalValidation = this.validatePrice(total);
        if (!totalValidation.isValid) {
            return { isValid: false, message: 'ยอดรวมไม่ถูกต้อง' };
        }
        
        if (receivedValidation.value < totalValidation.value) {
            return { isValid: false, message: 'จำนวนเงินที่รับไม่เพียงพอ' };
        }
        
        return { 
            isValid: true, 
            message: '', 
            received: receivedValidation.value,
            total: totalValidation.value,
            change: receivedValidation.value - totalValidation.value
        };
    }
    
    // Validate form data
    static validateFormData(data, rules) {
        const errors = {};
        let isValid = true;
        
        Object.keys(rules).forEach(field => {
            const rule = rules[field];
            const value = data[field];
            
            // Check if field is required
            if (rule.required) {
                const requiredValidation = this.validateRequired(value, rule.label || field);
                if (!requiredValidation.isValid) {
                    errors[field] = requiredValidation.message;
                    isValid = false;
                    return;
                }
            }
            
            // Skip other validations if field is empty and not required
            if (!rule.required && (!value || value === '')) {
                return;
            }
            
            // Apply specific validations
            if (rule.type) {
                let validation;
                
                switch (rule.type) {
                    case 'pin':
                        validation = this.validatePin(value);
                        break;
                    case 'email':
                        validation = this.validateEmail(value);
                        break;
                    case 'phone':
                        validation = this.validatePhone(value);
                        break;
                    case 'price':
                        validation = this.validatePrice(value);
                        break;
                    case 'stock':
                        validation = this.validateStock(value);
                        break;
                    case 'productName':
                        validation = this.validateProductName(value);
                        break;
                    case 'employeeName':
                        validation = this.validateEmployeeName(value);
                        break;
                    case 'barcode':
                        validation = this.validateBarcode(value);
                        break;
                    case 'url':
                        validation = this.validateUrl(value);
                        break;
                    case 'date':
                        validation = this.validateDate(value, rule.label);
                        break;
                    case 'number':
                        validation = this.validateNumberRange(value, rule.min, rule.max, rule.label);
                        break;
                    case 'string':
                        validation = this.validateStringLength(value, rule.minLength, rule.maxLength, rule.label);
                        break;
                    default:
                        validation = { isValid: true, message: '' };
                }
                
                if (!validation.isValid) {
                    errors[field] = validation.message;
                    isValid = false;
                }
            }
            
            // Custom validation function
            if (rule.validator && typeof rule.validator === 'function') {
                const customValidation = rule.validator(value, data);
                if (!customValidation.isValid) {
                    errors[field] = customValidation.message;
                    isValid = false;
                }
            }
        });
        
        return { isValid, errors };
    }
    
    // Sanitize input
    static sanitizeInput(input, type = 'string') {
        if (input === null || input === undefined) {
            return '';
        }
        
        let sanitized = String(input);
        
        switch (type) {
            case 'string':
                // Remove HTML tags and trim
                sanitized = sanitized.replace(/<[^>]*>/g, '').trim();
                break;
            case 'number':
                // Keep only numbers and decimal point
                sanitized = sanitized.replace(/[^0-9.]/g, '');
                break;
            case 'integer':
                // Keep only numbers
                sanitized = sanitized.replace(/[^0-9]/g, '');
                break;
            case 'pin':
                // Keep only numbers, limit to 4 digits
                sanitized = sanitized.replace(/[^0-9]/g, '').slice(0, 4);
                break;
            case 'phone':
                // Keep only numbers and common phone separators
                sanitized = sanitized.replace(/[^0-9\s-]/g, '');
                break;
            case 'email':
                // Basic email sanitization
                sanitized = sanitized.toLowerCase().trim();
                break;
            case 'barcode':
                // Keep only alphanumeric
                sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');
                break;
        }
        
        return sanitized;
    }
    
    // Format validation errors for display
    static formatErrors(errors) {
        if (Array.isArray(errors)) {
            return errors.join('\n');
        }
        
        if (typeof errors === 'object') {
            return Object.values(errors).join('\n');
        }
        
        return String(errors);
    }
    
    // Check if value is empty
    static isEmpty(value) {
        return value === null || 
               value === undefined || 
               value === '' || 
               (typeof value === 'string' && value.trim() === '') ||
               (Array.isArray(value) && value.length === 0) ||
               (typeof value === 'object' && Object.keys(value).length === 0);
    }
    
    // Validate Thai ID card number
    static validateThaiId(id) {
        if (!id) {
            return { isValid: false, message: 'กรุณาใส่เลขบัตรประชาชน' };
        }
        
        const cleanId = id.replace(/[^0-9]/g, '');
        
        if (cleanId.length !== 13) {
            return { isValid: false, message: 'เลขบัตรประชาชนต้องมี 13 หลัก' };
        }
        
        // Validate checksum
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cleanId.charAt(i)) * (13 - i);
        }
        
        const checkDigit = (11 - (sum % 11)) % 10;
        
        if (checkDigit !== parseInt(cleanId.charAt(12))) {
            return { isValid: false, message: 'เลขบัตรประชาชนไม่ถูกต้อง' };
        }
        
        return { isValid: true, message: '', value: cleanId };
    }
}

// Export validation functions
export const {
    validatePin,
    validateEmail,
    validatePhone,
    validatePrice,
    validateStock,
    validateProductName,
    validateEmployeeName,
    validateBarcode,
    validateUrl,
    validateRequired,
    validateNumberRange,
    validateStringLength,
    validateDate,
    validateDateRange,
    validatePaymentAmount,
    validateFormData,
    sanitizeInput,
    formatErrors,
    isEmpty,
    validateThaiId
} = ValidationUtils;

export default ValidationUtils;