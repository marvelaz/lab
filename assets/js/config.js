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

    // CSV column mappings
    CSV_COLUMNS: {
        ID: 'ID',
        DEVICE: 'Device',
        LAB_REGION: 'Lab Region',
        START_DATE: 'Start Date',
        END_DATE: 'End Date',
        REQUESTED_BY: 'Requested by',
        STATUS: 'Status'
    }
};