// Reservation Model
class Reservation {
    constructor(data) {
        this.id = data[CONFIG.CSV_COLUMNS.ID];
        this.device = data[CONFIG.CSV_COLUMNS.DEVICE];
        this.labRegion = data[CONFIG.CSV_COLUMNS.LAB_REGION];
        this.startDate = new Date(data[CONFIG.CSV_COLUMNS.START_DATE]);
        this.endDate = new Date(data[CONFIG.CSV_COLUMNS.END_DATE]);
        this.requestedBy = data[CONFIG.CSV_COLUMNS.REQUESTED_BY];
        this.status = Utils.normalize(data[CONFIG.CSV_COLUMNS.STATUS]);
        this.suggestion = null; // For conflict resolution suggestions
        this.rawData = data; // Keep original data for reference
        
        // Debug logging for first few reservations
        if (this.id && parseInt(this.id) <= 5) {
            console.log(`Reservation ${this.id} debug:`, {
                rawStartDate: data[CONFIG.CSV_COLUMNS.START_DATE],
                rawEndDate: data[CONFIG.CSV_COLUMNS.END_DATE],
                parsedStartDate: this.startDate.toISOString(),
                parsedEndDate: this.endDate.toISOString(),
                status: this.status,
                isValid: this.isValid()
            });
        }
    }

    /**
     * Check if this reservation is valid
     * @returns {boolean} True if reservation has valid data
     */
    isValid() {
        return this.id && 
               this.device && 
               this.labRegion && 
               Utils.isValidDate(this.startDate) && 
               Utils.isValidDate(this.endDate) &&
               this.startDate <= this.endDate; // Allow same-day reservations
    }

    /**
     * Check if this reservation conflicts with another
     * @param {Reservation} other - Other reservation to check against
     * @returns {boolean} True if reservations conflict
     */
    conflictsWith(other) {
        // Must be same device and region
        if (Utils.normalize(this.device) !== Utils.normalize(other.device) ||
            Utils.normalize(this.labRegion) !== Utils.normalize(other.labRegion)) {
            return false;
        }

        // Check date overlap
        return Utils.dateRangesOverlap(
            this.startDate, this.endDate,
            other.startDate, other.endDate
        );
    }

    /**
     * Get duration of this reservation
     * @returns {string} Human readable duration
     */
    getDuration() {
        return Utils.calculateDuration(this.startDate, this.endDate);
    }

    /**
     * Get duration in days
     * @returns {number} Duration in days
     */
    getDurationInDays() {
        const diffTime = Math.abs(this.endDate - this.startDate);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Same-day reservations should count as 1 day
        return days === 0 ? 1 : days;
    }

    /**
     * Check if reservation is in a specific status
     * @param {string} status - Status to check
     * @returns {boolean} True if reservation has the status
     */
    hasStatus(status) {
        return this.status === Utils.normalize(status);
    }

    /**
     * Check if reservation is new
     * @returns {boolean} True if status is new
     */
    isNew() {
        return this.hasStatus(CONFIG.STATUS.NEW);
    }

    /**
     * Check if reservation is acknowledged
     * @returns {boolean} True if status is acknowledged
     */
    isAcknowledged() {
        return this.hasStatus(CONFIG.STATUS.ACKNOWLEDGED);
    }

    /**
     * Check if reservation is resolved
     * @returns {boolean} True if status is resolved
     */
    isResolved() {
        return this.hasStatus(CONFIG.STATUS.RESOLVED);
    }

    /**
     * Get formatted start date
     * @returns {string} Formatted start date
     */
    getFormattedStartDate() {
        return Utils.formatDate(this.startDate);
    }

    /**
     * Get formatted end date
     * @returns {string} Formatted end date
     */
    getFormattedEndDate() {
        return Utils.formatDate(this.endDate);
    }

    /**
     * Get status CSS class
     * @returns {string} CSS class for status
     */
    getStatusClass() {
        return Utils.getStatusClass(this.status);
    }

    /**
     * Set conflict resolution suggestion
     * @param {string} suggestion - Suggestion text
     */
    setSuggestion(suggestion) {
        this.suggestion = suggestion;
    }

    /**
     * Check if reservation has a suggestion
     * @returns {boolean} True if has suggestion
     */
    hasSuggestion() {
        return this.suggestion !== null && this.suggestion !== '';
    }

    /**
     * Create a copy of this reservation with new dates
     * @param {Date} newStartDate - New start date
     * @param {Date} newEndDate - New end date
     * @returns {Reservation} New reservation instance
     */
    reschedule(newStartDate, newEndDate) {
        const newData = { ...this.rawData };
        newData[CONFIG.CSV_COLUMNS.START_DATE] = Utils.formatDate(newStartDate);
        newData[CONFIG.CSV_COLUMNS.END_DATE] = Utils.formatDate(newEndDate);
        return new Reservation(newData);
    }

    /**
     * Convert to plain object for serialization
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            id: this.id,
            device: this.device,
            labRegion: this.labRegion,
            startDate: this.getFormattedStartDate(),
            endDate: this.getFormattedEndDate(),
            requestedBy: this.requestedBy,
            status: this.status,
            duration: this.getDuration(),
            suggestion: this.suggestion
        };
    }
}