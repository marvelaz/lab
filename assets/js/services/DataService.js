// Data Service - Handles data loading and management
class DataService {
    constructor() {
        this.rawData = [];
        this.reservations = [];
        this.invalidRows = [];
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
                            validRows: this.reservations.length,
                            invalidRows: this.invalidRows
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
        this.reservations = [];
        this.invalidRows = [];
        
        this.rawData.forEach((row, index) => {
            const reservation = new Reservation(row);
            if (reservation.isValid()) {
                this.reservations.push(reservation);
            } else {
                this.invalidRows.push({
                    rowIndex: index + 2, // +2 because CSV has header row and arrays are 0-indexed
                    rawData: row,
                    reservation: reservation,
                    issues: this.validateRowIssues(row, reservation)
                });
            }
        });
        
        this.isProcessed = true;
    }

    /**
     * Validate a row and return specific issues
     * @param {Object} rawRow - Raw CSV row data
     * @param {Reservation} reservation - Reservation object
     * @returns {Array} Array of validation issues
     */
    validateRowIssues(rawRow, reservation) {
        const issues = [];
        
        // Check required fields
        if (!reservation.id) {
            issues.push({
                field: 'ID',
                issue: 'Missing or empty ID',
                value: rawRow[CONFIG.CSV_COLUMNS.ID],
                severity: 'error'
            });
        }
        
        if (!reservation.device) {
            issues.push({
                field: 'Device',
                issue: 'Missing or empty device name',
                value: rawRow[CONFIG.CSV_COLUMNS.DEVICE],
                severity: 'error'
            });
        }
        
        if (!reservation.labRegion) {
            issues.push({
                field: 'Lab Region',
                issue: 'Missing or empty lab region',
                value: rawRow[CONFIG.CSV_COLUMNS.LAB_REGION],
                severity: 'error'
            });
        }
        
        if (!reservation.requestedBy) {
            issues.push({
                field: 'Requested by',
                issue: 'Missing or empty requester',
                value: rawRow[CONFIG.CSV_COLUMNS.REQUESTED_BY],
                severity: 'warning'
            });
        }
        
        // Check dates
        if (!Utils.isValidDate(reservation.startDate)) {
            issues.push({
                field: 'Start Date',
                issue: 'Invalid or missing start date',
                value: rawRow[CONFIG.CSV_COLUMNS.START_DATE],
                severity: 'error',
                suggestion: 'Use format: YYYY-MM-DD'
            });
        }
        
        if (!Utils.isValidDate(reservation.endDate)) {
            issues.push({
                field: 'End Date',
                issue: 'Invalid or missing end date',
                value: rawRow[CONFIG.CSV_COLUMNS.END_DATE],
                severity: 'error',
                suggestion: 'Use format: YYYY-MM-DD'
            });
        }
        
        // Check date logic
        if (Utils.isValidDate(reservation.startDate) && Utils.isValidDate(reservation.endDate)) {
            if (reservation.startDate > reservation.endDate) {
                issues.push({
                    field: 'Date Range',
                    issue: 'Start date must be before or equal to end date',
                    value: `${rawRow[CONFIG.CSV_COLUMNS.START_DATE]} to ${rawRow[CONFIG.CSV_COLUMNS.END_DATE]}`,
                    severity: 'error'
                });
            }
        }
        
        // Check status
        const validStatuses = [CONFIG.STATUS.NEW, CONFIG.STATUS.ACKNOWLEDGED, CONFIG.STATUS.RESOLVED, CONFIG.STATUS.CANCELLED];
        if (reservation.status && !validStatuses.includes(reservation.status)) {
            issues.push({
                field: 'Status',
                issue: 'Invalid status value',
                value: rawRow[CONFIG.CSV_COLUMNS.STATUS],
                severity: 'warning',
                suggestion: `Valid values: ${validStatuses.join(', ')}`
            });
        }
        
        return issues;
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
     * Get invalid rows with validation issues
     * @returns {Array} Array of invalid row objects
     */
    getInvalidRows() {
        return this.invalidRows;
    }

    /**
     * Get validation summary
     * @returns {Object} Summary of validation results
     */
    getValidationSummary() {
        const summary = {
            totalRows: this.rawData.length,
            validRows: this.reservations.length,
            invalidRows: this.invalidRows.length,
            issuesByType: {},
            issuesBySeverity: { error: 0, warning: 0 }
        };

        this.invalidRows.forEach(invalidRow => {
            invalidRow.issues.forEach(issue => {
                // Count by issue type
                if (!summary.issuesByType[issue.issue]) {
                    summary.issuesByType[issue.issue] = 0;
                }
                summary.issuesByType[issue.issue]++;

                // Count by severity
                summary.issuesBySeverity[issue.severity]++;
            });
        });

        return summary;
    }

    /**
     * Attempt to auto-fix common issues in invalid rows
     * @returns {Object} Results of auto-fix attempt
     */
    attemptAutoFix() {
        let fixedCount = 0;
        const fixedRows = [];
        const stillInvalidRows = [];

        this.invalidRows.forEach(invalidRow => {
            const fixedData = this.tryFixRow(invalidRow.rawData);
            const testReservation = new Reservation(fixedData);
            
            if (testReservation.isValid()) {
                fixedRows.push({
                    originalRow: invalidRow,
                    fixedData: fixedData,
                    reservation: testReservation
                });
                fixedCount++;
            } else {
                stillInvalidRows.push(invalidRow);
            }
        });

        return {
            totalAttempted: this.invalidRows.length,
            fixedCount: fixedCount,
            stillInvalidCount: stillInvalidRows.length,
            fixedRows: fixedRows,
            stillInvalidRows: stillInvalidRows
        };
    }

    /**
     * Try to fix common issues in a row
     * @param {Object} rawData - Raw row data
     * @returns {Object} Potentially fixed row data
     */
    tryFixRow(rawData) {
        const fixedData = { ...rawData };

        // Fix common date format issues
        if (fixedData[CONFIG.CSV_COLUMNS.START_DATE]) {
            fixedData[CONFIG.CSV_COLUMNS.START_DATE] = this.tryFixDate(fixedData[CONFIG.CSV_COLUMNS.START_DATE]);
        }
        
        if (fixedData[CONFIG.CSV_COLUMNS.END_DATE]) {
            fixedData[CONFIG.CSV_COLUMNS.END_DATE] = this.tryFixDate(fixedData[CONFIG.CSV_COLUMNS.END_DATE]);
        }

        // Fix status values
        if (fixedData[CONFIG.CSV_COLUMNS.STATUS]) {
            fixedData[CONFIG.CSV_COLUMNS.STATUS] = this.tryFixStatus(fixedData[CONFIG.CSV_COLUMNS.STATUS]);
        }

        // Trim whitespace from all string fields
        Object.keys(fixedData).forEach(key => {
            if (typeof fixedData[key] === 'string') {
                fixedData[key] = fixedData[key].trim();
            }
        });

        return fixedData;
    }

    /**
     * Try to fix date format issues
     * @param {string} dateStr - Date string to fix
     * @returns {string} Potentially fixed date string
     */
    tryFixDate(dateStr) {
        if (!dateStr) return dateStr;

        const trimmed = dateStr.trim();
        
        // Try common date formats and convert to YYYY-MM-DD
        const dateFormats = [
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY or M/D/YYYY
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY or M-D-YYYY
            /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD or YYYY/M/D
            /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // MM.DD.YYYY or M.D.YYYY
        ];

        for (const format of dateFormats) {
            const match = trimmed.match(format);
            if (match) {
                let year, month, day;
                
                if (format === dateFormats[0] || format === dateFormats[1] || format === dateFormats[3]) {
                    // MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY formats
                    month = match[1].padStart(2, '0');
                    day = match[2].padStart(2, '0');
                    year = match[3];
                } else {
                    // YYYY/MM/DD format
                    year = match[1];
                    month = match[2].padStart(2, '0');
                    day = match[3].padStart(2, '0');
                }
                
                return `${year}-${month}-${day}`;
            }
        }

        return trimmed;
    }

    /**
     * Try to fix status values
     * @param {string} status - Status string to fix
     * @returns {string} Potentially fixed status string
     */
    tryFixStatus(status) {
        if (!status) return status;

        const normalized = status.toLowerCase().trim();
        
        // Map common variations to correct status
        const statusMap = {
            'new': CONFIG.STATUS.NEW,
            'pending': CONFIG.STATUS.NEW,
            'open': CONFIG.STATUS.NEW,
            'ack': CONFIG.STATUS.ACKNOWLEDGED,
            'acknowledged': CONFIG.STATUS.ACKNOWLEDGED,
            'confirm': CONFIG.STATUS.ACKNOWLEDGED,
            'confirmed': CONFIG.STATUS.ACKNOWLEDGED,
            'resolved': CONFIG.STATUS.RESOLVED,
            'complete': CONFIG.STATUS.RESOLVED,
            'completed': CONFIG.STATUS.RESOLVED,
            'done': CONFIG.STATUS.RESOLVED,
            'finished': CONFIG.STATUS.RESOLVED,
            'cancelled': CONFIG.STATUS.CANCELLED,
            'canceled': CONFIG.STATUS.CANCELLED,
            'cancel': CONFIG.STATUS.CANCELLED
        };

        return statusMap[normalized] || status;
    }

    /**
     * Apply fixes to the dataset
     * @param {Array} fixedRows - Array of fixed row objects
     */
    applyFixes(fixedRows) {
        // Add fixed reservations to the valid reservations
        fixedRows.forEach(fixedRow => {
            this.reservations.push(fixedRow.reservation);
        });

        // Remove fixed rows from invalid rows
        const fixedRowIndices = new Set(fixedRows.map(fr => fr.originalRow.rowIndex));
        this.invalidRows = this.invalidRows.filter(ir => !fixedRowIndices.has(ir.rowIndex));

        console.log(`Applied ${fixedRows.length} fixes. Now have ${this.reservations.length} valid reservations.`);
    }

    /**
     * Reset data service
     */
    reset() {
        this.rawData = [];
        this.reservations = [];
        this.invalidRows = [];
        this.isProcessed = false;
    }
}