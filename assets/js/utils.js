// Utility Functions
const Utils = {
    /**
     * Normalize string values for comparison
     * @param {string} val - Value to normalize
     * @returns {string} Normalized string
     */
    normalize(val) {
        return val ? val.toString().trim().toLowerCase() : "";
    },

    /**
     * Calculate duration between two dates
     * @param {string} startDate - Start date string
     * @param {string} endDate - End date string
     * @returns {string} Human readable duration
     */
    calculateDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return '1 day';
        } else if (diffDays < 7) {
            return `${diffDays} days`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            const remainingDays = diffDays % 7;
            return weeks === 1 ? 
                `1 week${remainingDays > 0 ? ` ${remainingDays} days` : ''}` : 
                `${weeks} weeks${remainingDays > 0 ? ` ${remainingDays} days` : ''}`;
        } else {
            const months = Math.floor(diffDays / 30);
            const remainingDays = diffDays % 30;
            return months === 1 ? 
                `1 month${remainingDays > 0 ? ` ${remainingDays} days` : ''}` : 
                `${months} months${remainingDays > 0 ? ` ${remainingDays} days` : ''}`;
        }
    },

    /**
     * Check if two date ranges overlap
     * @param {Date} start1 - First range start
     * @param {Date} end1 - First range end
     * @param {Date} start2 - Second range start
     * @param {Date} end2 - Second range end
     * @returns {boolean} True if ranges overlap
     */
    dateRangesOverlap(start1, end1, start2, end2) {
        return start1 < end2 && start2 < end1;
    },

    /**
     * Validate date string
     * @param {string} dateStr - Date string to validate
     * @returns {boolean} True if valid date
     */
    isValidDate(dateStr) {
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    },

    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toISOString().slice(0, 10);
    },

    /**
     * Get status CSS class
     * @param {string} status - Status string
     * @returns {string} CSS class name
     */
    getStatusClass(status) {
        const normalizedStatus = this.normalize(status);
        switch (normalizedStatus) {
            case CONFIG.STATUS.NEW:
                return 'status-new';
            case CONFIG.STATUS.ACKNOWLEDGED:
                return 'status-ack';
            case CONFIG.STATUS.RESOLVED:
                return 'status-res';
            default:
                return '';
        }
    },

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Show/hide loading spinner
     * @param {boolean} show - Whether to show loading
     */
    toggleLoading(show) {
        const loading = document.getElementById('loading');
        const results = document.getElementById('results');
        
        if (show) {
            loading.style.display = 'block';
            results.style.display = 'none';
        } else {
            loading.style.display = 'none';
            results.style.display = 'block';
        }
    },

    /**
     * Log error with context
     * @param {string} context - Error context
     * @param {Error} error - Error object
     */
    logError(context, error) {
        console.error(`[${context}]`, error);
    },

    /**
     * Generate unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};