// Statistics Display Component - Handles statistics visualization
class StatisticsDisplay {
    constructor() {
        this.statsContent = null;
        this.statsPlaceholder = null;
        this.charts = new Map(); // Store chart instances
    }

    /**
     * Initialize statistics display component
     */
    init() {
        this.statsContent = document.getElementById('statsContent');
        this.statsPlaceholder = document.getElementById('statsPlaceholder');
        this.timeframeSelect = document.getElementById('timeframeSelect');
        this.timeframeInfo = document.getElementById('statsTimeframeInfo');
        
        this.setupEventListeners();
        
        console.log('StatisticsDisplay component initialized');
    }

    /**
     * Setup event listeners for statistics controls
     */
    setupEventListeners() {
        if (this.timeframeSelect) {
            this.timeframeSelect.addEventListener('change', () => {
                this.handleTimeframeChange();
            });
        }

        const refreshStatsBtn = document.getElementById('refreshStatsBtn');
        if (refreshStatsBtn) {
            refreshStatsBtn.addEventListener('click', () => {
                this.handleRefreshStats();
            });
        }

        const debugStatsBtn = document.getElementById('debugStatsBtn');
        if (debugStatsBtn) {
            debugStatsBtn.addEventListener('click', () => {
                this.handleDebugStats();
            });
        }
    }

    /**
     * Handle timeframe selection change
     */
    handleTimeframeChange() {
        const selectedMonths = parseInt(this.timeframeSelect.value);
        console.log('Timeframe changed to:', selectedMonths, 'months');
        
        // Dispatch event to trigger statistics refresh
        const event = new CustomEvent('statisticsTimeframeChanged', {
            detail: { monthsBack: selectedMonths }
        });
        document.dispatchEvent(event);
    }

    /**
     * Handle refresh statistics button click
     */
    handleRefreshStats() {
        const selectedMonths = parseInt(this.timeframeSelect.value);
        
        // Dispatch event to trigger statistics refresh
        const event = new CustomEvent('statisticsRefreshRequested', {
            detail: { monthsBack: selectedMonths }
        });
        document.dispatchEvent(event);
    }

    /**
     * Handle debug statistics button click
     */
    handleDebugStats() {
        // Dispatch event to trigger debug information
        const event = new CustomEvent('statisticsDebugRequested');
        document.dispatchEvent(event);
    }

    /**
     * Display statistics data
     * @param {Object} statistics - Statistics data object
     * @param {Object} timeframeInfo - Information about the timeframe used
     */
    displayStatistics(statistics, timeframeInfo = null) {
        if (!this.statsContent) return;

        console.log('Displaying statistics:', statistics);
        console.log('Timeframe info:', timeframeInfo);

        this.showStatsContent();
        
        // Update timeframe information
        if (timeframeInfo) {
            this.updateTimeframeInfo(timeframeInfo);
        }
        
        // Display summary information first
        if (statistics.summary) {
            this.displaySummaryInfo(statistics.summary);
        }
        
        // Display device utilization
        this.displayDeviceUtilization(statistics.deviceUtilization);
        
        // Display top devices by region
        this.displayTopDevicesByRegion(statistics.topDevicesByRegion);
        
        // Display top users
        this.displayTopUsers(statistics.topUsers);
    }

    /**
     * Update timeframe information display
     * @param {Object} timeframeInfo - Timeframe information
     */
    updateTimeframeInfo(timeframeInfo) {
        if (!this.timeframeInfo) return;

        const { monthsBack, totalReservations, dateRange } = timeframeInfo;
        
        let timeframeText = '';
        if (monthsBack === 0) {
            timeframeText = 'All time';
        } else {
            timeframeText = `Last ${monthsBack} month${monthsBack > 1 ? 's' : ''}`;
        }

        let infoText = `Showing ${totalReservations.toLocaleString()} resolved reservations from ${timeframeText}`;
        
        if (dateRange) {
            infoText += ` (${dateRange.earliest} to ${dateRange.latest})`;
        }

        this.timeframeInfo.innerHTML = infoText;
    }

    /**
     * Display summary information
     * @param {Object} summary - Summary statistics
     */
    displaySummaryInfo(summary) {
        // Find existing summary or create new one
        const existingSection = document.querySelector('.stats-summary-section');
        if (existingSection) {
            existingSection.remove();
        }

        const summarySection = document.createElement('div');
        summarySection.className = 'stats-summary-section';
        summarySection.style.cssText = `
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
        `;

        summarySection.innerHTML = `
            <div class="summary-item">
                <div class="summary-label">Total Reservations</div>
                <div class="summary-value">${summary.totalReservations.toLocaleString()}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Days</div>
                <div class="summary-value">${summary.totalDays.toLocaleString()}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Unique Devices</div>
                <div class="summary-value">${summary.uniqueDevices}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Unique Users</div>
                <div class="summary-value">${summary.uniqueUsers}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Regions</div>
                <div class="summary-value">${summary.uniqueRegions}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Timeframe</div>
                <div class="summary-value">${summary.timeframe}</div>
            </div>
        `;

        // Insert at the beginning of stats content
        this.statsContent.insertBefore(summarySection, this.statsContent.firstChild);
    }    /**

     * Display device utilization for different timeframes
     * @param {Object} deviceUtilization - Device utilization data
     */
    displayDeviceUtilization(deviceUtilization) {
        const container = document.getElementById('deviceUtilizationChart');
        if (!container || !deviceUtilization) return;

        const timeframes = ['1months', '3months', '6months', '12months'];
        
        let html = '<div class="utilization-timeframes">';
        
        timeframes.forEach(timeframe => {
            const months = timeframe.replace('months', '');
            const data = deviceUtilization[timeframe];
            
            if (!data) return;
            
            html += `<div class="timeframe-section">`;
            html += `<h4>${months} Month${months > 1 ? 's' : ''}</h4>`;
            
            const regions = Object.keys(data);
            if (regions.length === 0) {
                html += '<p class="no-data">No data available</p>';
            } else {
                regions.forEach(region => {
                    const devices = Object.entries(data[region])
                        .map(([device, stats]) => ({ device, ...stats }))
                        .sort((a, b) => b.daysUsed - a.daysUsed)
                        .slice(0, 5); // Top 5 per region
                    
                    html += `<div class="region-utilization">`;
                    html += `<h5>${region}</h5>`;
                    html += `<div class="device-list">`;
                    
                    devices.forEach(device => {
                        html += `
                            <div class="device-item">
                                <span class="device-name">${device.device}</span>
                                <span class="device-days">${device.daysUsed} days</span>
                                <span class="device-reservations">(${device.reservationCount} reservations)</span>
                            </div>
                        `;
                    });
                    
                    html += `</div></div>`;
                });
            }
            
            html += `</div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Display top devices by region
     * @param {Object} topDevicesByRegion - Top devices data by region
     */
    displayTopDevicesByRegion(topDevicesByRegion) {
        const container = document.getElementById('topDevicesByRegion');
        if (!container || !topDevicesByRegion) return;

        const regions = Object.keys(topDevicesByRegion);
        
        if (regions.length === 0) {
            container.innerHTML = '<p class="no-data">No data available</p>';
            return;
        }

        let html = '<div class="regional-tabs">';
        
        // Create tabs
        html += '<div class="tab-buttons">';
        regions.forEach((region, index) => {
            html += `<button class="tab-btn ${index === 0 ? 'active' : ''}" onclick="this.parentNode.parentNode.querySelector('.tab-btn.active').classList.remove('active'); this.classList.add('active'); this.parentNode.parentNode.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active')); this.parentNode.parentNode.querySelector('#region-${index}').classList.add('active');">${region}</button>`;
        });
        html += '</div>';
        
        // Create tab contents
        regions.forEach((region, index) => {
            const devices = topDevicesByRegion[region];
            html += `<div id="region-${index}" class="tab-content ${index === 0 ? 'active' : ''}">`;
            html += '<div class="devices-ranking">';
            
            devices.forEach((device, deviceIndex) => {
                html += `
                    <div class="device-rank-item">
                        <div class="rank-number">${deviceIndex + 1}</div>
                        <div class="device-info">
                            <div class="device-name">${device.device}</div>
                            <div class="device-stats">
                                <span class="stat">${device.daysUsed} days used</span>
                                <span class="stat">${device.reservationCount} reservations</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Display top users
     * @param {Array} topUsers - Top users data
     */
    displayTopUsers(topUsers) {
        const container = document.getElementById('topUsersTable');
        if (!container || !topUsers) return;

        if (topUsers.length === 0) {
            container.innerHTML = '<p class="no-data">No data available</p>';
            return;
        }

        let html = '<div class="users-ranking">';
        
        topUsers.forEach((user, index) => {
            html += `
                <div class="user-rank-item">
                    <div class="rank-number">${index + 1}</div>
                    <div class="user-info">
                        <div class="user-name">${user.user}</div>
                        <div class="user-stats">
                            <span class="stat"><strong>${user.numberOfReservations}</strong> reservations</span>
                            <span class="stat"><strong>${user.numberOfDevices}</strong> devices</span>
                            <span class="stat"><strong>${user.numberOfDays}</strong> days</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Show statistics content and hide placeholder
     */
    showStatsContent() {
        if (this.statsContent) {
            this.statsContent.style.display = 'block';
        }
        if (this.statsPlaceholder) {
            this.statsPlaceholder.style.display = 'none';
        }
    }

    /**
     * Show no data message
     */
    showNoDataMessage() {
        if (this.statsContent) {
            this.statsContent.style.display = 'none';
        }
        if (this.statsPlaceholder) {
            this.statsPlaceholder.style.display = 'block';
        }
    }

    /**
     * Clear all displays and destroy charts
     */
    clear() {
        // Destroy all charts
        this.charts.forEach(chart => {
            chart.destroy();
        });
        this.charts.clear();

        // Clear content
        if (this.statsContent) {
            this.statsContent.style.display = 'none';
        }
        
        this.showNoDataMessage();
    }
}