// Data Service - Handles data loading and management
class DataService {
    constructor() {
        this.rawData = [];
        this.reservations = [];
        this.isProcessed = false;
    }

    /**
     * Load CSV file and parse data
     * @param {File} file - CSV file to load
     * @returns {Promise} Promise that resolves when data is loaded
     */
    loadCSVFile(file) {
        return new Promise((resolve, reject) => {
            if (!this.validateFile(file)) {
                reject(new Error('Invalid file type or size'));
                return;
            }

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false,
                complete: (results) => {
                    try {
                        this.rawData = results.data;
                        this.processData();
                        console.log(`Loaded ${this.reservations.length} valid reservations from ${this.rawData.length} total rows`);
                        resolve({
                            reservations: this.reservations,
                            totalRows: this.rawData.length,
                            validRows: this.reservations.length
                        });
                    } catch (error) {
                        Utils.logError('DataService.loadCSVFile', error);
                        reject(error);
                    }
                },
                error: (error) => {
                    Utils.logError('DataService.loadCSVFile.Papa', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Validate uploaded file
     * @param {File} file - File to validate
     * @returns {boolean} True if file is valid
     */
    validateFile(file) {
        if (!file) return false;
        
        // Check file type
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!CONFIG.FILE.ACCEPTED_TYPES.includes(fileExtension)) {
            return false;
        }

        // Check file size
        if (file.size > CONFIG.FILE.MAX_SIZE) {
            return false;
        }

        return true;
    }

    /**
     * Process raw data into Reservation objects
     */
    processData() {
        this.reservations = this.rawData
            .map(row => new Reservation(row))
            .filter(reservation => reservation.isValid());
        
        this.isProcessed = true;
    }

    /**
     * Get all reservations
     * @returns {Reservation[]} Array of all reservations
     */
    getAllReservations() {
        return this.reservations;
    }

    /**
     * Get reservations by status
     * @param {string} status - Status to filter by
     * @returns {Reservation[]} Filtered reservations
     */
    getReservationsByStatus(status) {
        return this.reservations.filter(reservation => 
            reservation.hasStatus(status)
        );
    }

    /**
     * Get new reservations
     * @returns {Reservation[]} New reservations
     */
    getNewReservations() {
        return this.getReservationsByStatus(CONFIG.STATUS.NEW);
    }

    /**
     * Get acknowledged reservations
     * @returns {Reservation[]} Acknowledged reservations
     */
    getAcknowledgedReservations() {
        return this.getReservationsByStatus(CONFIG.STATUS.ACKNOWLEDGED);
    }

    /**
     * Get resolved reservations
     * @returns {Reservation[]} Resolved reservations
     */
    getResolvedReservations() {
        return this.getReservationsByStatus(CONFIG.STATUS.RESOLVED);
    }

    /**
     * Get reservations for statistics (last N months, excluding cancelled)
     * @param {number} monthsBack - Number of months to look back
     * @returns {Reservation[]} Filtered reservations for stats
     */
    getReservationsForStats(monthsBack = CONFIG.STATS.MONTHS_BACK) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);

        return this.reservations.filter(reservation => 
            reservation.startDate >= cutoffDate && 
            !reservation.hasStatus(CONFIG.STATUS.CANCELLED)
        );
    }

    /**
     * Get unique devices
     * @returns {string[]} Array of unique device names
     */
    getUniqueDevices() {
        const devices = new Set();
        this.reservations.forEach(reservation => {
            devices.add(reservation.device);
        });
        return Array.from(devices).sort();
    }

    /**
     * Get unique lab regions
     * @returns {string[]} Array of unique lab regions
     */
    getUniqueRegions() {
        const regions = new Set();
        this.reservations.forEach(reservation => {
            regions.add(reservation.labRegion);
        });
        return Array.from(regions).sort();
    }

    /**
     * Get unique users
     * @returns {string[]} Array of unique users
     */
    getUniqueUsers() {
        const users = new Set();
        this.reservations.forEach(reservation => {
            users.add(reservation.requestedBy);
        });
        return Array.from(users).sort();
    }

    /**
     * Get reservations by device and region
     * @param {string} device - Device name
     * @param {string} region - Lab region
     * @returns {Reservation[]} Filtered reservations
     */
    getReservationsByDeviceAndRegion(device, region) {
        return this.reservations.filter(reservation =>
            Utils.normalize(reservation.device) === Utils.normalize(device) &&
            Utils.normalize(reservation.labRegion) === Utils.normalize(region)
        );
    }

    /**
     * Check if data has been processed
     * @returns {boolean} True if data is processed
     */
    isDataProcessed() {
        return this.isProcessed;
    }

    /**
     * Get data summary
     * @returns {Object} Summary statistics
     */
    getDataSummary() {
        return {
            totalReservations: this.reservations.length,
            newReservations: this.getNewReservations().length,
            acknowledgedReservations: this.getAcknowledgedReservations().length,
            resolvedReservations: this.getResolvedReservations().length,
            uniqueDevices: this.getUniqueDevices().length,
            uniqueRegions: this.getUniqueRegions().length,
            uniqueUsers: this.getUniqueUsers().length
        };
    }

    /**
     * Reset data service
     */
    reset() {
        this.rawData = [];
        this.reservations = [];
        this.isProcessed = false;
    }
}