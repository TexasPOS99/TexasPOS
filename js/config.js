// Configuration
export const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    
    // App Configuration
    APP_NAME: 'TexasPOS',
    APP_VERSION: '1.0.0',
    
    // UI Configuration
    TOAST_DURATION: 5000,
    LOADING_MIN_DURATION: 1000,
    ANIMATION_DURATION: 300,
    
    // Business Logic
    LOW_STOCK_THRESHOLD: 10,
    AUTO_LOGOUT_TIME: 30 * 60 * 1000, // 30 minutes
    
    // Pagination
    ITEMS_PER_PAGE: 20,
    
    // Theme
    DEFAULT_THEME: 'dark',
    
    // Shifts
    SHIFTS: {
        morning: { name: 'กะเช้า', start: '06:00', end: '14:00' },
        afternoon: { name: 'กะบ่าย', start: '14:00', end: '22:00' },
        night: { name: 'กะดึก', start: '22:00', end: '06:00' }
    },
    
    // Payment Methods
    PAYMENT_METHODS: {
        cash: 'เงินสด',
        transfer: 'โอน'
    },
    
    // Employee Roles
    ROLES: {
        admin: 'แอดมิน',
        employee: 'พนักงาน'
    },
    
    // Stock Change Types
    STOCK_CHANGE_TYPES: {
        sale: 'ขาย',
        adjustment: 'ปรับปรุง',
        restock: 'เติมสต็อก'
    },
    
    // API Endpoints (if needed for external services)
    API_ENDPOINTS: {
        // Add external API endpoints here if needed
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        THEME: 'texaspos_theme',
        USER_SESSION: 'texaspos_session',
        CART: 'texaspos_cart',
        SETTINGS: 'texaspos_settings'
    },
    
    // Error Messages
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
        INVALID_PIN: 'รหัส PIN ไม่ถูกต้อง',
        UNAUTHORIZED: 'คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้',
        INSUFFICIENT_STOCK: 'สินค้าในสต็อกไม่เพียงพอ',
        INVALID_INPUT: 'ข้อมูลที่กรอกไม่ถูกต้อง',
        SERVER_ERROR: 'เกิดข้อผิดพลาดในระบบ กรุณาติดต่อผู้ดูแลระบบ'
    },
    
    // Success Messages
    SUCCESS_MESSAGES: {
        LOGIN_SUCCESS: 'เข้าสู่ระบบสำเร็จ',
        LOGOUT_SUCCESS: 'ออกจากระบบสำเร็จ',
        SAVE_SUCCESS: 'บันทึกข้อมูลสำเร็จ',
        DELETE_SUCCESS: 'ลบข้อมูลสำเร็จ',
        UPDATE_SUCCESS: 'อัปเดตข้อมูลสำเร็จ',
        PRODUCT_ADDED: 'เพิ่มสินค้าในตะกร้าแล้ว',
        SALE_COMPLETED: 'ขายสินค้าสำเร็จ',
        STOCK_UPDATED: 'อัปเดตสต็อกสำเร็จ'
    },
    
    // Validation Rules
    VALIDATION: {
        PIN_LENGTH: 4,
        MIN_PASSWORD_LENGTH: 6,
        MAX_PRODUCT_NAME_LENGTH: 200,
        MAX_EMPLOYEE_NAME_LENGTH: 100,
        MIN_PRICE: 0.01,
        MAX_PRICE: 999999.99,
        MIN_STOCK: 0,
        MAX_STOCK: 999999
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_BARCODE_SCANNER: false,
        ENABLE_RECEIPT_PRINTER: false,
        ENABLE_CASH_DRAWER: false,
        ENABLE_CUSTOMER_DISPLAY: false,
        ENABLE_LOYALTY_PROGRAM: false,
        ENABLE_MULTI_CURRENCY: false,
        ENABLE_TAX_CALCULATION: false,
        ENABLE_DISCOUNT_SYSTEM: false
    },
    
    // Debug Mode
    DEBUG: import.meta.env.DEV || false
};

// Utility function to get config value with fallback
export function getConfig(key, fallback = null) {
    const keys = key.split('.');
    let value = CONFIG;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return fallback;
        }
    }
    
    return value;
}

// Utility function to check if feature is enabled
export function isFeatureEnabled(feature) {
    return getConfig(`FEATURES.${feature}`, false);
}

// Utility function to get error message
export function getErrorMessage(key) {
    return getConfig(`ERROR_MESSAGES.${key}`, 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
}

// Utility function to get success message
export function getSuccessMessage(key) {
    return getConfig(`SUCCESS_MESSAGES.${key}`, 'ดำเนินการสำเร็จ');
}

// Utility function to validate input
export function validateInput(type, value) {
    const validation = CONFIG.VALIDATION;
    
    switch (type) {
        case 'pin':
            return value && value.length === validation.PIN_LENGTH && /^\d+$/.test(value);
        case 'price':
            const price = parseFloat(value);
            return !isNaN(price) && price >= validation.MIN_PRICE && price <= validation.MAX_PRICE;
        case 'stock':
            const stock = parseInt(value);
            return !isNaN(stock) && stock >= validation.MIN_STOCK && stock <= validation.MAX_STOCK;
        case 'productName':
            return value && value.trim().length > 0 && value.length <= validation.MAX_PRODUCT_NAME_LENGTH;
        case 'employeeName':
            return value && value.trim().length > 0 && value.length <= validation.MAX_EMPLOYEE_NAME_LENGTH;
        default:
            return true;
    }
}

// Export default config
export default CONFIG;