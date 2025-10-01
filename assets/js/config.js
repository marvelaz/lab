// Application Configuration
const CONFIG = {
    // File processing settings
    FILE: {
        ACCEPTED_TYPES: ['.csv'],
        MAX_SIZE: 10 * 1024 * 1024, // 10MB
        ENCODING: 'UTF-8'
    },

    // Date and time settings
    DATE: {
        FORMAT: 'YYYY-MM-DD',
        TIMEZONE: 'UTC'
    },

    // Statistics settings
    STATS: {
        MONTHS_BACK: 6,
        TOP_ITEMS_LIMIT: 10,
        UTILIZATION_DAYS: 180
    },

    // Conflict resolution settings
    CONFLICT: {
        RESOLUTION_MODE: 'STABILITY', // 'STABILITY' or 'SPLIT_TIME'
        BUFFER_DAYS: 1 // Days to add between rescheduled reservations
    },

    // UI settings
    UI: {
        LOADING_DELAY: 1000, // ms
        ANIMATION_DURATION: 300 // ms
    },

    // Status types
    STATUS: {
        NEW: 'new',
        ACKNOWLEDGED: 'acknowledged',
        RESOLVED: 'resolved',
        CANCELLED: 'cancelled'
    },

    // Power usage settings
    POWER: {
        COST_PER_KWH: 0.12, // $0.12 per kWh (adjust for your region)
        CO2_PER_KWH: 0.4, // kg CO2 per kWh (adjust for your grid)
        CURRENCY: 'USD',
        NETBOX_URL: null, // To be configured
        APC_URL: null     // To be configured
    },

    // CSV column mappings
    CSV_COLUMNS: {
        ID: 'ID',
        SMART_ID: 'SMART ID',
        DEVICE: 'Device',
        LAB_REGION: 'Lab Region',
        START_DATE: 'Start Date',
        END_DATE: 'End Date',
        REQUESTED_BY: 'Requested by',
        CABLING_CHANGE: 'Cabling Change?',
        APPROVED_BY: 'Approved by',
        STATUS: 'Status'
    },

    // Remote Hands Configuration
    REMOTE_HANDS: {
        HOURS_PER_MONTH_PER_REGION: 20,
        COST_PER_HOUR: 120, // Configurable $/hour
        WARNING_THRESHOLD: 0.8, // 80% - Warning level
        CRITICAL_THRESHOLD: 0.95, // 95% - Critical level
        CABLING_CHANGE_HOURS: 1, // 1 hour per "yes" in cabling change
        CURRENCY: 'USD'
    }
};