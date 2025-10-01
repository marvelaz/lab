// Remote Hands Display Component - Handles remote hands visualization
class RemoteHandsDisplay {
    constructor() {
        this.remoteHandsContent = null;
        this.remoteHandsPlaceholder = null;
        this.timeframeSelect = null;
        this.refreshBtn = null;
        this.timeframeInfo = null;
    }

    /**
     * Initialize remote hands display component
     */
    init() {
        this.remoteHandsContent = document.getElementById('remoteHandsContent');
        this.remoteHandsPlaceholder = document.getElementById('remoteHandsPlaceholder');
        this.timeframeSelect = document.getElementById('remoteHandsTimeframeSelect');
        this.refreshBtn = document.getElementById('refreshRemoteHandsBtn');
        this.timeframeInfo = document.getElementById('remoteHandsTimeframeInfo');
        
        this.setupEventListeners();
        
        console.log('RemoteHandsDisplay component initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.timeframeSelect) {
            this.timeframeSelect.addEventListener('change', () => {
                this.handleTimeframeChange();
            });
        }

        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => {
                this.handleRefresh();
            });
        }

        // Category tab switching
        const categoryTabs = document.querySelectorAll('.stats-category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.handleCategorySwitch(e.target.dataset.category);
            });
        });

        // Go to validation button
        const goToValidationBtn = document.getElementById('goToRemoteHandsValidationBtn');
        if (goToValidationBtn) {
            goToValidationBtn.addEventListener('click', () => {
                const event = new CustomEvent('pageChanged', {
                    detail: { pageId: 'validation' }
                });
                document.dispatchEvent(event);
            });
        }
    }

    /**
     * Handle timeframe change
     */
    handleTimeframeChange() {
        const selectedMonths = parseInt(this.timeframeSelect.value);
        
        const event = new CustomEvent('remoteHandsTimeframeChanged', {
            detail: { monthsBack: selectedMonths }
        });
        document.dispatchEvent(event);
    }

    /**
     * Handle refresh button click
     */
    handleRefresh() {
        const selectedMonths = parseInt(this.timeframeSelect.value);
        
        const event = new CustomEvent('remoteHandsRefreshRequested', {
            detail: { monthsBack: selectedMonths }
        });
        document.dispatchEvent(event);
    }

    /**
     * Handle category tab switching
     * @param {string} category - Category to switch to
     */
    handleCategorySwitch(category) {
        // Update tab states
        document.querySelectorAll('.stats-category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        // Update section visibility
        document.querySelectorAll('.stats-category-section').forEach(section => {
            section.classList.remove('active');
        });

        // Map category names to actual section IDs
        const sectionMap = {
            'capacity': 'capacitySection',
            'devices': 'deviceAnalysisSection', 
            'users': 'userAnalysisSection'
        };
        
        const targetSection = document.getElementById(sectionMap[category]);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    /**
     * Display remote hands analytics
     * @param {Object} analytics - Remote hands analytics data
     * @param {Object} timeframeInfo - Timeframe information
     */
    displayRemoteHandsAnalytics(analytics, timeframeInfo = null) {
        if (!this.remoteHandsContent) return;

        this.showContent();
        
        // Update timeframe information
        if (timeframeInfo) {
            this.updateTimeframeInfo(timeframeInfo);
        }
        
        // Display capacity overview
        this.displayCapacityOverview(analytics.capacityOverview);
        
        // Display device analysis
        this.displayDeviceAnalysis(analytics.deviceAnalysis);
        
        // Display user analysis
        this.displayUserAnalysis(analytics.userAnalysis);
        
        // Display regional analysis
        this.displayRegionalDeviceImpact(analytics.capacityOverview);
        this.displayRegionalUserActivity(analytics.capacityOverview);
    }

    /**
     * Show content and hide placeholder
     */
    showContent() {
        if (this.remoteHandsContent) {
            this.remoteHandsContent.style.display = 'block';
        }
        if (this.remoteHandsPlaceholder) {
            this.remoteHandsPlaceholder.style.display = 'none';
        }
    }

    /**
     * Show no data message
     */
    showNoDataMessage() {
        if (this.remoteHandsContent) {
            this.remoteHandsContent.style.display = 'none';
        }
        if (this.remoteHandsPlaceholder) {
            this.remoteHandsPlaceholder.style.display = 'block';
        }
    }

    /**
     * Update timeframe information
     * @param {Object} timeframeInfo - Timeframe information
     */
    updateTimeframeInfo(timeframeInfo) {
        if (!this.timeframeInfo) return;

        const { monthsBack, totalChanges, dateRange } = timeframeInfo;
        
        let timeframeText = '';
        if (monthsBack === 0) {
            timeframeText = 'All time';
        } else {
            timeframeText = `Last ${monthsBack} month${monthsBack > 1 ? 's' : ''}`;
        }

        let infoText = `Showing ${totalChanges} cabling changes from ${timeframeText}`;
        
        if (dateRange) {
            infoText += ` (${dateRange.earliest} to ${dateRange.latest})`;
        }

        this.timeframeInfo.innerHTML = infoText;
    }

    /**
     * Display capacity overview
     * @param {Object} capacityData - Capacity overview data
     */
    displayCapacityOverview(capacityData) {
        this.displayMonthlySummaryCards(capacityData.totals, capacityData.timeframe);
        this.displayRegionalCapacity(capacityData.regional);
        this.displayCapacityAlerts(capacityData.regional);
        this.displayWeeklyBreakdownChart(capacityData);
    }

    /**
     * Display monthly summary cards with monthly averages
     * @param {Object} totals - Total statistics
     * @param {Object} timeframe - Timeframe information
     */
    displayMonthlySummaryCards(totals, timeframe = null) {
        const container = document.getElementById('monthlySummaryCards');
        if (!container) return;

        // Calculate monthly averages
        const monthsInTimeframe = timeframe ? timeframe.selectedMonths || timeframe.months : 1;
        const monthlyAvgHours = Math.round((totals.hoursUsed / monthsInTimeframe) * 100) / 100;
        const monthlyAvgCost = Math.round((totals.cost / monthsInTimeframe) * 100) / 100;
        const monthlyAvgChanges = Math.round((totals.changesCount / monthsInTimeframe) * 100) / 100;

        const cards = [
            {
                value: `${totals.hoursUsed}/${totals.hoursAvailable}`,
                label: 'Total Hours Used',
                subtitle: `${totals.utilizationRate}% utilization`
            },
            {
                value: `$${totals.cost.toLocaleString()}`,
                label: 'Total Cost',
                subtitle: `$${monthlyAvgCost.toLocaleString()}/month avg`
            },
            {
                value: totals.changesCount,
                label: 'Total Changes',
                subtitle: `${monthlyAvgChanges}/month avg`
            },
            {
                value: `${monthlyAvgHours} hrs`,
                label: 'Monthly Average',
                subtitle: `Over ${monthsInTimeframe} month${monthsInTimeframe > 1 ? 's' : ''}`
            }
        ];

        let html = '<div class="remote-hands-summary-grid">';
        cards.forEach(card => {
            html += `
                <div class="remote-hands-summary-card">
                    <div class="remote-hands-card-value">${card.value}</div>
                    <div class="remote-hands-card-label">${card.label}</div>
                    <div class="remote-hands-card-subtitle">${card.subtitle}</div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    /**
     * Display regional capacity utilization
     * @param {Array} regionalData - Regional capacity data
     */
    displayRegionalCapacity(regionalData) {
        const container = document.getElementById('regionalCapacityChart');
        if (!container) return;

        let html = '<div class="regional-capacity-list">';
        
        regionalData.forEach(region => {
            const utilizationClass = this.getUtilizationClass(region.utilizationRate);
            
            html += `
                <div class="region-capacity-item" style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #333;">${region.region}</span>
                        <span class="capacity-status ${region.status}">${region.status.toUpperCase()}</span>
                    </div>
                    <div class="remote-hands-utilization-bar">
                        <div class="remote-hands-utilization-fill ${utilizationClass}" 
                             style="width: ${Math.min(region.utilizationRate, 100)}%"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85em; color: #666; margin-top: 4px;">
                        <span>${region.hoursUsed}/${region.hoursAvailable} hours</span>
                        <span>${region.utilizationRate}% • $${region.cost.toLocaleString()}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Display capacity alerts
     * @param {Array} regionalData - Regional capacity data
     */
    displayCapacityAlerts(regionalData) {
        const container = document.getElementById('capacityAlerts');
        if (!container) return;

        const alerts = [];
        
        regionalData.forEach(region => {
            if (region.status === 'critical') {
                alerts.push({
                    type: 'critical',
                    title: `${region.region} Over Capacity`,
                    message: `${region.utilizationRate}% utilized. Consider adding ${Math.ceil(region.hoursUsed - region.hoursAvailable)} hours/month.`
                });
            } else if (region.status === 'warning') {
                alerts.push({
                    type: 'warning',
                    title: `${region.region} High Utilization`,
                    message: `${region.utilizationRate}% utilized. Monitor closely for capacity issues.`
                });
            }
        });

        if (alerts.length === 0) {
            alerts.push({
                type: 'info',
                title: 'All Regions Operating Normally',
                message: 'No capacity issues detected across lab regions.'
            });
        }

        let html = '<div class="capacity-alerts">';
        alerts.forEach(alert => {
            html += `
                <div class="capacity-alert ${alert.type}">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    /**
     * Display device analysis
     * @param {Array} deviceData - Device analysis data
     */
    displayDeviceAnalysis(deviceData) {
        const container = document.getElementById('highMaintenanceDevices');
        if (!container) return;

        const topDevices = deviceData.slice(0, 10);

        let html = '<div class="device-maintenance-list">';
        topDevices.forEach((device, index) => {
            html += `
                <div class="device-maintenance-item">
                    <div class="device-rank">${index + 1}</div>
                    <div class="device-maintenance-info">
                        <div class="device-maintenance-name">${device.device}</div>
                        <div class="device-maintenance-metrics">
                            <span class="maintenance-metric hours">${device.hoursUsed} hours</span>
                            <span class="maintenance-metric cost">$${device.cost.toLocaleString()}</span>
                            <span class="maintenance-metric">${device.changesCount} changes</span>
                            <span class="maintenance-metric">${device.usersCount} users</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
        
        // Display additional device analysis sections
        this.displayDeviceEfficiencyOpportunities(deviceData);
        this.displayDeviceMaintenanceTrends();
    }

    /**
     * Display user analysis
     * @param {Array} userData - User analysis data
     */
    displayUserAnalysis(userData) {
        const container = document.getElementById('topRemoteHandsUsers');
        if (!container) return;

        const topUsers = userData.slice(0, 10);

        let html = '<div class="device-maintenance-list">';
        topUsers.forEach((user, index) => {
            html += `
                <div class="device-maintenance-item">
                    <div class="device-rank">${index + 1}</div>
                    <div class="device-maintenance-info">
                        <div class="device-maintenance-name">${user.user}</div>
                        <div class="device-maintenance-metrics">
                            <span class="maintenance-metric hours">${user.hoursUsed} hours</span>
                            <span class="maintenance-metric cost">$${user.cost.toLocaleString()}</span>
                            <span class="maintenance-metric">${user.changesCount} changes</span>
                            <span class="maintenance-metric">${user.devicesCount} devices</span>
                            <span class="maintenance-metric percentage">${user.efficiencyScore}% efficiency</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
        
        // Display additional user analysis sections
        this.displayUserEfficiencyMetrics(userData);
        this.displayUserRemoteHandsPatterns();
    }

    /**
     * Get utilization class based on percentage
     * @param {number} utilizationRate - Utilization rate percentage
     * @returns {string} CSS class name
     */
    getUtilizationClass(utilizationRate) {
        if (utilizationRate >= 95) return 'utilization-critical';
        if (utilizationRate >= 80) return 'utilization-high';
        if (utilizationRate >= 50) return 'utilization-medium';
        return 'utilization-low';
    }

    /**
     * Display device efficiency opportunities (placeholder)
     * @param {Array} deviceData - Device analysis data
     */
    displayDeviceEfficiencyOpportunities(deviceData) {
        const container = document.getElementById('deviceEfficiencyOpportunities');
        if (!container) return;

        const inefficientDevices = deviceData.filter(device => device.hoursUsed > 5);
        
        if (inefficientDevices.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No efficiency opportunities identified.</p>';
            return;
        }

        let html = '<div class="efficiency-opportunities">';
        inefficientDevices.slice(0, 5).forEach(device => {
            const savings = Math.round(device.hoursUsed * 0.2 * CONFIG.REMOTE_HANDS.COST_PER_HOUR);
            html += `
                <div class="efficiency-item">
                    <div class="efficiency-device">${device.device}</div>
                    <div class="efficiency-suggestion">Potential 20% reduction: Save ${savings.toLocaleString()}</div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    /**
     * Display regional device impact (placeholder)
     * @param {Object} capacityData - Capacity data by region
     */
    displayRegionalDeviceImpact(capacityData) {
        const container = document.getElementById('regionalDeviceImpact');
        if (!container) return;

        let html = '<div class="regional-impact-list">';
        capacityData.regional.forEach(region => {
            html += `
                <div class="regional-impact-item">
                    <div class="region-name">${region.region}</div>
                    <div class="impact-metrics">
                        <span class="impact-hours">${region.hoursUsed} hours</span>
                        <span class="impact-changes">${region.changesCount} changes</span>
                        <span class="impact-cost">${region.cost.toLocaleString()}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    /**
     * Display device maintenance trends (placeholder)
     */
    displayDeviceMaintenanceTrends() {
        const container = document.getElementById('deviceMaintenanceTrends');
        if (!container) return;
        
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Trend analysis coming soon...</p>';
    }

    /**
     * Display user efficiency metrics (placeholder)
     * @param {Array} userData - User analysis data
     */
    displayUserEfficiencyMetrics(userData) {
        const container = document.getElementById('userEfficiencyMetrics');
        if (!container) return;

        const avgEfficiency = userData.reduce((sum, user) => sum + user.efficiencyScore, 0) / userData.length;
        const highEfficiencyUsers = userData.filter(user => user.efficiencyScore >= 80).length;
        
        let html = `
            <div class="efficiency-metrics">
                <div class="metric-card">
                    <div class="metric-value">${Math.round(avgEfficiency)}%</div>
                    <div class="metric-label">Average Efficiency</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${highEfficiencyUsers}</div>
                    <div class="metric-label">High Efficiency Users</div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    /**
     * Display regional user activity (placeholder)
     * @param {Object} capacityData - Capacity data by region
     */
    displayRegionalUserActivity(capacityData) {
        const container = document.getElementById('regionalUserActivity');
        if (!container) return;
        
        let html = '<div class="regional-user-activity">';
        capacityData.regional.forEach(region => {
            const avgHoursPerUser = region.hoursUsed / Math.max(1, region.changesCount);
            html += `
                <div class="region-user-item">
                    <div class="region-name">${region.region}</div>
                    <div class="user-activity-stats">
                        <span>${region.changesCount} changes</span>
                        <span>${Math.round(avgHoursPerUser * 100) / 100} avg hrs/change</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    /**
     * Display user remote hands patterns (placeholder)
     */
    displayUserRemoteHandsPatterns() {
        const container = document.getElementById('userRemoteHandsPatterns');
        if (!container) return;
        
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Pattern analysis coming soon...</p>';
    }

    /**
     * Display weekly breakdown chart (placeholder)
     * @param {Object} capacityData - Capacity data
     */
    displayWeeklyBreakdownChart(capacityData) {
        const container = document.getElementById('weeklyBreakdownChart');
        if (!container) return;
        
        const weeklyAvg = Math.round(capacityData.totals.hoursUsed / 4 * 100) / 100;
        
        container.innerHTML = `
            <div class="weekly-breakdown">
                <div class="weekly-stat">
                    <div class="weekly-value">${weeklyAvg} hrs</div>
                    <div class="weekly-label">Average per Week</div>
                </div>
                <div class="weekly-note">
                    <p style="color: #666; font-size: 0.9em;">Based on ${capacityData.totals.hoursUsed} total hours over timeframe</p>
                </div>
            </div>
        `;
    }

    /**
     * Clear all displays
     */
    clear() {
        this.showNoDataMessage();
    }
}