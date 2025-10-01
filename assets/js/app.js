// Main Application Controller
class LabEquipmentApp {
    constructor() {
        this.dataService = new DataService();
        this.conflictService = new ConflictService();
        this.statisticsService = new StatisticsService();

        
        this.navigation = new Navigation();
        this.fileUpload = new FileUpload(this.dataService);
        this.conflictDisplay = new ConflictDisplay();
        this.statisticsDisplay = new StatisticsDisplay();

        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('Initializing Lab Equipment Management System...');
        
        // Initialize components
        this.navigation.init();
        this.fileUpload.init();
        this.conflictDisplay.init();
        this.statisticsDisplay.init();

        

        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('Application initialized successfully');
    }

    /**
     * Set up application-wide event listeners
     */
    setupEventListeners() {
        // File upload events
        document.addEventListener('fileUploaded', (event) => {
            this.handleFileUploaded(event.detail);
        });

        // Validation events
        document.addEventListener('validationRequested', () => {
            this.handleValidationRequested();
        });

        // Navigation events
        document.addEventListener('pageChanged', (event) => {
            this.handlePageChanged(event.detail.pageId);
        });

        // Statistics timeframe events
        document.addEventListener('statisticsTimeframeChanged', (event) => {
            this.handleStatisticsTimeframeChanged(event.detail.monthsBack);
        });

        document.addEventListener('statisticsRefreshRequested', (event) => {
            this.handleStatisticsRefreshRequested(event.detail.monthsBack);
        });

        document.addEventListener('statisticsDebugRequested', () => {
            this.handleStatisticsDebugRequested();
        });



        // Error handling
        window.addEventListener('error', (event) => {
            Utils.logError('Global', event.error);
        });
    }

    /**
     * Handle file upload completion
     * @param {Object} fileData - Uploaded file data
     */
    handleFileUploaded(fileData) {
        console.log('File uploaded:', fileData.fileName);
        // File is already processed by DataService through FileUpload component
    }

    /**
     * Handle validation request
     */
    async handleValidationRequested() {
        try {
            Utils.toggleLoading(true);
            
            // Simulate processing delay for UX
            await new Promise(resolve => 
                setTimeout(resolve, CONFIG.UI.LOADING_DELAY)
            );
            
            await this.processReservations();
            
            Utils.toggleLoading(false);
            
        } catch (error) {
            Utils.logError('App.handleValidationRequested', error);
            Utils.toggleLoading(false);
            this.showError('Failed to process reservations. Please try again.');
        }
    }

    /**
     * Process reservations and detect conflicts
     */
    async processReservations() {
        if (!this.dataService.isDataProcessed()) {
            throw new Error('No data available for processing');
        }

        // Get reservations by status
        const newReservations = this.dataService.getNewReservations();
        const acknowledgedReservations = this.dataService.getAcknowledgedReservations();
        const resolvedReservations = this.dataService.getResolvedReservations();

        console.log('Processing reservations:', {
            new: newReservations.length,
            acknowledged: acknowledgedReservations.length,
            resolved: resolvedReservations.length
        });

        // Find conflicts
        let conflicts = this.conflictService.findConflicts(
            newReservations, 
            acknowledgedReservations, 
            resolvedReservations
        );

        // Apply conflict resolution
        conflicts = this.conflictService.resolveConflictsStabilityMode(conflicts);

        // Get valid reservations
        const validReservations = this.conflictService.getValidReservations(
            newReservations, 
            conflicts
        );

        // Display results
        this.displayResults(conflicts, validReservations, newReservations);
    }

    /**
     * Display processing results
     * @param {ConflictGroup[]} conflicts - Detected conflicts
     * @param {Reservation[]} validReservations - Valid reservations
     * @param {Reservation[]} newReservations - All new reservations
     */
    displayResults(conflicts, validReservations, newReservations) {
        // Display summary cards
        this.displaySummaryCards(conflicts, validReservations, newReservations);
        
        // Display conflicts
        this.conflictDisplay.displayConflicts(conflicts);
        
        // Display valid reservations
        this.conflictDisplay.displayValidReservations(validReservations);
    }

    /**
     * Display summary cards
     * @param {ConflictGroup[]} conflicts - Detected conflicts
     * @param {Reservation[]} validReservations - Valid reservations
     * @param {Reservation[]} newReservations - All new reservations
     */
    displaySummaryCards(conflicts, validReservations, newReservations) {
        const conflictSummary = this.conflictService.getConflictSummary(conflicts);
        
        const summaryData = {
            totalNew: newReservations.length,
            totalConflicted: conflictSummary.totalConflicted,
            totalValid: validReservations.length,
            conflictGroups: conflictSummary.conflictGroups
        };

        this.conflictDisplay.displaySummaryCards(summaryData);
    }

    /**
     * Handle page navigation
     * @param {string} pageId - Target page ID
     */
    handlePageChanged(pageId) {
        if (pageId === 'statistics' && this.dataService.isDataProcessed()) {
            // Get the selected timeframe from the dropdown
            const timeframeSelect = document.getElementById('timeframeSelect');
            const selectedMonths = timeframeSelect ? parseInt(timeframeSelect.value) : CONFIG.STATS.MONTHS_BACK;
            this.loadStatistics(selectedMonths);
        }
    }

    /**
     * Load and display statistics
     * @param {number} monthsBack - Number of months to look back (optional)
     */
    async loadStatistics(monthsBack = null) {
        try {
            // Use default if monthsBack is null or undefined
            const effectiveMonthsBack = monthsBack !== null ? monthsBack : CONFIG.STATS.MONTHS_BACK;
            console.log('loadStatistics called with monthsBack:', monthsBack, 'effective:', effectiveMonthsBack);
            
            // Get all reservations (service will filter for resolved status and timeframe)
            const allReservations = this.dataService.getAllReservations();
            
            if (allReservations.length === 0) {
                this.statisticsDisplay.showNoDataMessage();
                return;
            }

            // Generate statistics (service handles filtering for resolved status and timeframe)
            const statistics = this.statisticsService.generateStatistics(allReservations, effectiveMonthsBack);
            
            // Count resolved reservations for timeframe info
            const resolvedReservations = allReservations.filter(r => r.status === CONFIG.STATUS.RESOLVED);
            const filteredReservations = effectiveMonthsBack > 0 ? 
                this.statisticsService.filterByTimeframe(resolvedReservations, effectiveMonthsBack) : 
                resolvedReservations;
            
            // Get timeframe information
            const timeframeInfo = this.getTimeframeInfo(effectiveMonthsBack, filteredReservations);
            
            // Display statistics
            this.statisticsDisplay.displayStatistics(statistics, timeframeInfo);
            
        } catch (error) {
            Utils.logError('App.loadStatistics', error);
            this.showError('Failed to load statistics. Please try again.');
        }
    }

    /**
     * Handle statistics timeframe change
     * @param {number} monthsBack - Number of months to look back
     */
    handleStatisticsTimeframeChanged(monthsBack) {
        console.log('App received timeframe change event:', monthsBack);
        if (this.dataService.isDataProcessed()) {
            console.log('Loading statistics for', monthsBack, 'months');
            // Clear cache to ensure fresh data
            this.statisticsService.clearCache();
            this.loadStatistics(monthsBack);
        } else {
            console.log('No data processed yet');
        }
    }

    /**
     * Handle statistics refresh request
     * @param {number} monthsBack - Number of months to look back
     */
    handleStatisticsRefreshRequested(monthsBack) {
        if (this.dataService.isDataProcessed()) {
            // Clear statistics cache before refreshing
            this.statisticsService.clearCache();
            this.loadStatistics(monthsBack);
        }
    }

    /**
     * Handle statistics debug request
     */
    handleStatisticsDebugRequested() {
        if (!this.dataService.isDataProcessed()) {
            alert('No data loaded');
            return;
        }

        const allReservations = this.dataService.getAllReservations();
        const timeframeSelect = document.getElementById('timeframeSelect');
        const selectedMonths = timeframeSelect ? parseInt(timeframeSelect.value) : 6;
        
        // Get stats data with current timeframe
        const statsData = this.dataService.getReservationsForStats(selectedMonths);
        
        // Get all time data for comparison
        const allTimeData = this.dataService.getReservationsForStats(0);
        
        const debugInfo = {
            totalReservations: allReservations.length,
            selectedTimeframe: selectedMonths,
            statsDataCount: statsData.length,
            allTimeDataCount: allTimeData.length,
            cancelledCount: allReservations.filter(r => r.hasStatus(CONFIG.STATUS.CANCELLED)).length,
            statusBreakdown: {
                new: allReservations.filter(r => r.hasStatus(CONFIG.STATUS.NEW)).length,
                acknowledged: allReservations.filter(r => r.hasStatus(CONFIG.STATUS.ACKNOWLEDGED)).length,
                resolved: allReservations.filter(r => r.hasStatus(CONFIG.STATUS.RESOLVED)).length,
                cancelled: allReservations.filter(r => r.hasStatus(CONFIG.STATUS.CANCELLED)).length
            },
            sampleDates: allReservations.slice(0, 10).map(r => ({
                id: r.id,
                startDate: r.startDate.toISOString().split('T')[0],
                status: r.status
            }))
        };
        
        console.log('Statistics Debug Info:', debugInfo);
        alert(`Debug Info (check console for details):
Total Reservations: ${debugInfo.totalReservations}
Selected Timeframe: ${selectedMonths} months
Filtered Count: ${debugInfo.statsDataCount}
All Time Count: ${debugInfo.allTimeDataCount}
Cancelled: ${debugInfo.cancelledCount}

Status Breakdown:
- New: ${debugInfo.statusBreakdown.new}
- Acknowledged: ${debugInfo.statusBreakdown.acknowledged}  
- Resolved: ${debugInfo.statusBreakdown.resolved}
- Cancelled: ${debugInfo.statusBreakdown.cancelled}`);
    }

    /**
     * Get timeframe information for display
     * @param {number} monthsBack - Number of months back
     * @param {Array} statsData - Filtered statistics data
     * @returns {Object} Timeframe information
     */
    getTimeframeInfo(monthsBack, statsData) {
        const allReservations = this.dataService.getAllReservations();
        const cancelledCount = allReservations.filter(r => r.hasStatus(CONFIG.STATUS.CANCELLED)).length;
        
        console.log('Timeframe info debug:', {
            monthsBack,
            allReservationsCount: allReservations.length,
            statsDataCount: statsData.length,
            cancelledCount
        });
        
        // Calculate date range from stats data
        let dateRange = null;
        if (statsData.length > 0) {
            const dates = statsData.map(r => r.startDate).sort((a, b) => a - b);
            dateRange = {
                earliest: Utils.formatDate(dates[0]),
                latest: Utils.formatDate(dates[dates.length - 1])
            };
        }

        return {
            monthsBack: monthsBack || CONFIG.STATS.MONTHS_BACK,
            totalReservations: statsData.length,
            dateRange: dateRange,
            excludedCount: cancelledCount
        };
    }

    /**
     * Show error message to user
     * @param {string} message - Error message
     */
    showError(message) {
        // Simple error display - could be enhanced with a proper modal/toast
        alert(message);
    }

    /**
     * Get application state
     * @returns {Object} Current application state
     */
    getState() {
        return {
            dataLoaded: this.dataService.isDataProcessed(),
            dataSummary: this.dataService.isDataProcessed() ? 
                this.dataService.getDataSummary() : null,
            conflictsDetected: this.conflictService.conflicts.length > 0
        };
    }



    /**
     * Reset application state
     */
    reset() {
        this.dataService.reset();
        this.conflictService.reset();
        this.conflictDisplay.clear();
        // Don't clear statistics/power/remote hands displays on reset
        // They should only be cleared when explicitly needed
        
        // Reset UI
        Utils.toggleLoading(false);
        const resultsElement = document.getElementById('results');
        if (resultsElement) {
            resultsElement.style.display = 'none';
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LabEquipmentApp();
});