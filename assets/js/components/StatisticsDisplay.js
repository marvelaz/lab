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

        this.showStatsContent();
        
        // Update timeframe information
        if (timeframeInfo) {
            this.updateTimeframeInfo(timeframeInfo);
        }
        
        // Display summary information first
        if (statistics.summary) {
            this.displaySummaryInfo(statistics.summary);
        }
        
        // Display device analytics
        this.displayDeviceUtilization(statistics.deviceUtilization);
        this.displayUtilizationHeatmap(statistics.utilizationHeatmap);
        this.displayConflictAnalysis(statistics.conflictAnalysis);
        this.displayEfficiencyMetrics(statistics.efficiencyMetrics);
        
        // Display user analytics
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
        } else if (monthsBack === 1) {
            timeframeText = 'Last 30 days';
        } else if (monthsBack === 3) {
            timeframeText = 'Last 90 days';
        } else if (monthsBack === 6) {
            timeframeText = 'Last 180 days';
        } else if (monthsBack === 12) {
            timeframeText = 'Last 365 days';
        } else {
            timeframeText = `Last ${monthsBack} months`;
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
    }

    /**
     * Display device utilization for the selected timeframe only
     * @param {Object} deviceUtilization - Device utilization data
     */
    displayDeviceUtilization(deviceUtilization) {
        const container = document.getElementById('deviceUtilizationChart');
        if (!container || !deviceUtilization) return;

        const { selectedPeriod, periodLabel } = deviceUtilization;
        
        if (!selectedPeriod) {
            container.innerHTML = '<p class="no-data">No data available</p>';
            return;
        }
        
        let html = '<div class="single-timeframe-utilization">';
        html += `<div class="timeframe-header">`;
        html += `<h4>${periodLabel}</h4>`;
        html += `</div>`;
        
        const regions = Object.keys(selectedPeriod);
        if (regions.length === 0) {
            html += '<p class="no-data">No data available for this period</p>';
        } else {
            html += '<div class="regions-grid">';
            
            regions.forEach(region => {
                const devices = Object.entries(selectedPeriod[region])
                    .map(([device, stats]) => ({ device, ...stats }))
                    .sort((a, b) => b.daysUsed - a.daysUsed)
                    .slice(0, 10); // Top 10 per region
                
                html += `<div class="region-utilization">`;
                html += `<h5>${region}</h5>`;
                
                if (devices.length === 0) {
                    html += '<p class="no-data-small">No devices used in this period</p>';
                } else {
                    html += `<div class="device-list">`;
                    
                    devices.forEach((device, index) => {
                        html += `
                            <div class="device-item">
                                <span class="device-rank">${index + 1}</span>
                                <span class="device-name">${device.device}</span>
                                <span class="device-days">${device.daysUsed} days</span>
                                <span class="device-reservations">(${device.reservationCount} reservations)</span>
                            </div>
                        `;
                    });
                    
                    html += `</div>`;
                }
                
                html += `</div>`;
            });
            
            html += '</div>';
        }
        
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

    /**
     * Display monthly conflict patterns (last 365 days)
     * @param {Object} conflictData - Monthly conflict data
     */
    displayUtilizationHeatmap(conflictData) {
        const container = document.getElementById('utilizationHeatmap');
        if (!container || !conflictData) {
            console.log('Conflict patterns container or data missing:', !!container, !!conflictData);
            return;
        }

        const { monthlyConflicts, peakMonth, lowMonth, totalConflicts } = conflictData;

        let html = '<div class="conflict-patterns-summary">';
        html += '<div class="insight-box">';
        html += '<div class="insight-item">📈 <strong>Peak:</strong> ' + peakMonth.label + ' (' + peakMonth.conflicts + ' conflicts)</div>';
        html += '<div class="insight-item">📉 <strong>Low:</strong> ' + lowMonth.label + ' (' + lowMonth.conflicts + ' conflicts)</div>';
        html += '<div class="insight-item">📊 <strong>Total:</strong> ' + totalConflicts + ' conflicts in last 365 days</div>';
        html += '</div>';
        html += '</div>';

        // Find max conflicts for scaling
        const maxConflicts = Math.max(...monthlyConflicts.map(m => m.conflicts), 1);

        html += '<div class="monthly-chart">';
        monthlyConflicts.forEach(month => {
            const barHeight = Math.max((month.conflicts / maxConflicts) * 100, 5);
            const colorClass = month.conflicts >= maxConflicts * 0.7 ? 'high' : 
                              month.conflicts >= maxConflicts * 0.4 ? 'medium' : 'low';
            
            html += '<div class="monthly-bar">';
            html += '<div class="bar-container">';
            html += '<div class="bar ' + colorClass + '" style="height: ' + barHeight + '%"></div>';
            html += '</div>';
            html += '<div class="bar-label">' + month.month + '</div>';
            html += '<div class="bar-value">' + month.conflicts + '</div>';
            html += '</div>';
        });
        html += '</div>';

        html += '<div class="chart-note">Shows conflict pairs detected over the last 365 days, independent of selected timeframe</div>';

        container.innerHTML = html;
    }

    /**
     * Display conflict analysis
     * @param {Object} conflictData - Conflict analysis data
     */
    displayConflictAnalysis(conflictData) {
        const container = document.getElementById('conflictAnalysis');
        if (!container || !conflictData) {
            console.log('Conflict container or data missing:', !!container, !!conflictData);
            return;
        }

        const { totalConflicts, topBottlenecks, recommendations } = conflictData;

        let html = '<div class="conflict-summary">';
        html += '<div class="metric-highlight">';
        html += '<span class="metric-number">' + totalConflicts + '</span>';
        html += '<span class="metric-label">Total Conflict Pairs</span>';
        html += '</div>';
        html += '<div class="conflict-explanation">Each pair represents two overlapping reservations for the same device</div>';
        html += '</div>';

        if (topBottlenecks.length > 0) {
            html += '<div class="bottleneck-list">';
            html += '<div class="bottleneck-header">Top Conflict Devices (showing ' + Math.min(topBottlenecks.length, 5) + ' of ' + topBottlenecks.length + ' total)</div>';
            topBottlenecks.slice(0, 5).forEach((bottleneck) => {
                const severity = bottleneck.conflicts >= 5 ? 'high' : bottleneck.conflicts >= 3 ? 'medium' : 'low';
                html += '<div class="bottleneck-item ' + severity + '">';
                html += '<div class="bottleneck-info">';
                html += '<div class="device-name">' + bottleneck.device + '</div>';
                html += '<div class="region-name">' + bottleneck.region + '</div>';
                html += '</div>';
                html += '<div class="conflict-stats">';
                html += '<span class="conflict-count">' + bottleneck.conflicts + '</span>';
                html += '<span class="impact-days">' + (bottleneck.impactDays || 0) + ' days impact</span>';
                html += '</div>';
                html += '</div>';
            });
            html += '</div>';
        } else {
            html += '<div class="no-conflicts">✅ No significant conflicts detected</div>';
        }

        if (recommendations.length > 0) {
            html += '<div class="recommendations">';
            html += '<h4>💡 Recommendations</h4>';
            recommendations.forEach(rec => {
                html += '<div class="recommendation-item">• ' + rec + '</div>';
            });
            html += '</div>';
        }

        container.innerHTML = html;
    }

    /**
     * Display efficiency metrics
     * @param {Object} efficiencyData - Efficiency metrics data
     */
    displayEfficiencyMetrics(efficiencyData) {
        const container = document.getElementById('efficiencyMetrics');
        if (!container || !efficiencyData) {
            console.log('Efficiency container or data missing:', !!container, !!efficiencyData);
            return;
        }

        const { 
            avgBookingLeadTime, 
            avgActualDuration, 
            earlyTerminationRate, 
            lastMinuteBookingRate,
            efficiencyOpportunities 
        } = efficiencyData;

        let html = '<div class="efficiency-metrics">';
        
        html += '<div class="metrics-grid">';
        html += '<div class="metric-item">';
        html += '<div class="metric-value">' + avgBookingLeadTime + '</div>';
        html += '<div class="metric-label">Avg Lead Time (days)</div>';
        html += '</div>';
        html += '<div class="metric-item">';
        html += '<div class="metric-value">' + avgActualDuration + '</div>';
        html += '<div class="metric-label">Avg Duration (days)</div>';
        html += '</div>';
        html += '<div class="metric-item">';
        html += '<div class="metric-value">' + earlyTerminationRate + '%</div>';
        html += '<div class="metric-label">Short Bookings</div>';
        html += '</div>';
        html += '<div class="metric-item">';
        html += '<div class="metric-value">' + lastMinuteBookingRate + '%</div>';
        html += '<div class="metric-label">Estimated Last-minute</div>';
        html += '</div>';
        html += '</div>';

        if (efficiencyOpportunities.length > 0) {
            html += '<div class="opportunities">';
            html += '<h4>🎯 Opportunities</h4>';
            efficiencyOpportunities.forEach(opp => {
                html += '<div class="opportunity-item">• ' + opp + '</div>';
            });
            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    }
}