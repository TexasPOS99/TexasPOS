// Theme Management
import { CONFIG } from './config.js';

export class ThemeManager {
    constructor() {
        this.currentTheme = CONFIG.DEFAULT_THEME;
        this.storageKey = CONFIG.STORAGE_KEYS.THEME;
        this.transitionClass = 'theme-changing';
        this.transitionDuration = 300;
    }
    
    async init() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem(this.storageKey);
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
            this.currentTheme = savedTheme;
        } else {
            // Detect system preference
            this.currentTheme = this.detectSystemTheme();
        }
        
        // Apply theme
        this.applyTheme(this.currentTheme, false);
        
        // Listen for system theme changes
        this.setupSystemThemeListener();
    }
    
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }
    
    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a theme
                const savedTheme = localStorage.getItem(this.storageKey);
                if (!savedTheme) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(newTheme, true);
                    this.currentTheme = newTheme;
                }
            });
        }
    }
    
    applyTheme(theme, animate = true) {
        const html = document.documentElement;
        const body = document.body;
        
        if (animate) {
            // Add transition class
            body.classList.add(this.transitionClass);
            
            // Remove transition class after animation
            setTimeout(() => {
                body.classList.remove(this.transitionClass);
            }, this.transitionDuration);
        }
        
        // Set theme attribute
        html.setAttribute('data-theme', theme);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme, previousTheme: this.currentTheme }
        }));
    }
    
    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        // Set appropriate theme color based on theme
        const colors = {
            dark: '#0a0a0a',
            light: '#ffffff'
        };
        
        metaThemeColor.content = colors[theme] || colors.dark;
    }
    
    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    setTheme(theme) {
        if (!['light', 'dark'].includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }
        
        if (theme === this.currentTheme) {
            return;
        }
        
        // Apply theme with animation
        this.applyTheme(theme, true);
        
        // Update current theme
        this.currentTheme = theme;
        
        // Save to localStorage
        localStorage.setItem(this.storageKey, theme);
        
        // Update theme toggle button icon if needed
        this.updateThemeToggleIcon();
    }
    
    updateThemeToggleIcon() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('.menu-icon');
        if (!icon) return;
        
        // Update icon based on current theme
        const iconPaths = {
            dark: 'M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.4 6.35,17.41C9.37,20.43 14,20.54 17.33,17.97Z',
            light: 'M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z'
        };
        
        const path = icon.querySelector('path');
        if (path) {
            path.setAttribute('d', iconPaths[this.currentTheme]);
        }
    }
    
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }
    
    isLightTheme() {
        return this.currentTheme === 'light';
    }
    
    // Get CSS custom property value for current theme
    getCSSVariable(property) {
        return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
    }
    
    // Set CSS custom property
    setCSSVariable(property, value) {
        document.documentElement.style.setProperty(property, value);
    }
    
    // Create theme-aware color utilities
    getThemeColors() {
        return {
            primary: this.getCSSVariable('--bg-primary'),
            secondary: this.getCSSVariable('--bg-secondary'),
            tertiary: this.getCSSVariable('--bg-tertiary'),
            card: this.getCSSVariable('--bg-card'),
            hover: this.getCSSVariable('--bg-hover'),
            textPrimary: this.getCSSVariable('--text-primary'),
            textSecondary: this.getCSSVariable('--text-secondary'),
            textMuted: this.getCSSVariable('--text-muted'),
            accent: this.getCSSVariable('--accent-primary'),
            accentSecondary: this.getCSSVariable('--accent-secondary'),
            success: this.getCSSVariable('--success'),
            error: this.getCSSVariable('--error'),
            warning: this.getCSSVariable('--warning'),
            border: this.getCSSVariable('--border-color'),
            borderHover: this.getCSSVariable('--border-hover')
        };
    }
    
    // Preload theme assets if needed
    async preloadThemeAssets(theme) {
        // This could be used to preload theme-specific images or fonts
        // For now, it's a placeholder for future enhancements
        return Promise.resolve();
    }
    
    // Export theme configuration
    exportThemeConfig() {
        return {
            currentTheme: this.currentTheme,
            colors: this.getThemeColors(),
            timestamp: new Date().toISOString()
        };
    }
    
    // Import theme configuration
    importThemeConfig(config) {
        if (config && config.currentTheme) {
            this.setTheme(config.currentTheme);
        }
    }
}

// Create and export singleton instance
export const themeManager = new ThemeManager();

// Make theme manager globally available for debugging
if (CONFIG.DEBUG) {
    window.themeManager = themeManager;
}

export default ThemeManager;