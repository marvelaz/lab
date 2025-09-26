// Power Display Component - Handles power usage visualization
class PowerDisplay {
    constructor() {
        this.powerContent = null;
        this.powerPlaceholder = null;
        this.charts = new Map();
    }

    /**
     * Initialize power display component
     */
    init() {
        this.powerContent = document.getElementById('powerContent');
        this.powerPlaceholder = document.getElementById('powerPlaceholder');
        
        console.log('PowerDisplay component initialized');
    }

    /**
     * Display power statistics
     * @param {Object} powerStats - Power statistics data
     */
    displayPowerStatistics(powerStats) {
        if (!this.powerContent) return;

        this.showPowerContent();
        
        // Display power sections
        this.displayPowerSummaryCards(powerStats.summary);
        this.displayDevicePowerConsumption(powerStats.devicePowerConsumption);
        this.displayRegionPowerUsage(powerStats.regionPowerUsage);
        this.displayUserPowerImpact(powerStats.userPowerImpact);
        this.displayPowerEfficiency(powerStats.powerEfficiency);
        this.displayCostAnalysis(powerStats.costAnalysis);
        this.displayPowerTrends(powerStats.powerTrends);
    }

    /**
     * Show power content and hide placeholder
     */
    showPowerContent() {
        if (this.powerContent) {
            this.powerContent.style.display = 'block';
        }
        if (this.powerPlaceholder) {
            this.powerPlaceholder.style.display = 'none';
        }
    }

    /**
     * Show no data message
     */
    showNoDataMessage() {
        if (this.powerContent) {
            this.powerContent.style.display = 'none';
        }
        if (this.powerPlaceholder) {
            this.powerPlaceholder.style.display = 'block';
        }
    }

    /**
     * Display power summary cards
     * @param {Object} summary - Power summary data
     */
    displayPowerSummaryCards(summary) {
        const container = document.getElementById('powerSummaryCards');
        if (!container) return;

        const cards = [
            {
                title: 'Total Energy',
                value: `${summary.totalEnergyKwh} kWh`,
                icon: '⚡',
                class: 'energy-card'
            },
            {
                title: 'Total Cost',
                value: `$${summary.totalCost}`,
                icon: '💰',
                class: 'cost-card'
            },
            {
                title: 'Carbon Footprint',
                value: `${summary.totalCarbonFootprint} kg CO₂`,
                icon: '🌱',
                class: 'carbon-card'
            },
            {
                title: 'Avg Power Draw',
                value: `${summary.avgPowerDraw} W`,
                icon: '📊',
                class: 'power-card'
            },
            {
                title: 'Peak Power',
                value: `${summary.peakPowerDraw} W`,
                icon: '📈',
                class: 'peak-card'
            },
            {
                title: 'Data Coverage',
                value: `${summary.dataCompleteness}%`,
                icon: '📋',
                class: 'coverage-card'
            }
        ];

        let html = '<div class="power-summary-grid">';
        cards.forEach(card => {
            html += `
                <div class="power-summary-card ${card.class}">
                    <div class="card-icon">${card.icon}</div>
                    <div class="card-content">
                        <div class="card-value">${card.value}</div>
                        <div class="card-title">${card.title}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    /**
     * Display device power consumption
     * @param {Array} devicePowerData - Device power consumption data
     */
    displayDevicePowerConsumption(devicePowerData) {
        const container = document.getElementById('devicePowerChart');
        if (!container) return;

        if (devicePowerData.length === 0) {
            container.innerHTML = '<div class="unified-stats-card"><p class="no-data">No device power data available</p></div>';
            return;
        }

        // Create unified card with chart
        let html = '<div class="unified-stats-card">';
        html += '<div class="power-device-list">';
        
        devicePowerData.forEach((device, index) => {
            const efficiencyClass = device.efficiency > 80 ? 'high-efficiency' : 
                                  device.efficiency > 60 ? 'medium-efficiency' : 'low-efficiency';
            
            html += `
                <div class="power-device-item ${efficiencyClass}">
                    <div class="device-rank">${index + 1}</div>
                    <div class="device-info">
                        <div class="device-name">${device.device}</div>
                        <div class="device-metrics">
                            <span class="power-metric energy">${device.totalEnergyKwh} kWh</span>
                            <span class="power-metric cost">$${device.estimatedCost.toFixed(2)}</span>
                            <span class="power-metric efficiency">${device.efficiency.toFixed(1)}% efficient</span>
                            <span class="power-metric power">${device.avgPowerDraw.toFixed(1)}W avg</span>
                        </div>
                        <div class="power-bar">
                            <div class="power-fill" style="width: ${Math.min((device.avgPowerDraw / device.maxPowerSpec) * 100, 100)}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
        container.innerHTML = html;
    }

    /**
     * Display region power usage
     * @param {Object} regionPowerData - Region power usage data
     */
    displayRegionPowerUsage(regionPowerData) {
        const container = document.getElementById('regionPowerUsage');
        if (!container) return;

        const regions = Object.keys(regionPowerData);
        if (regions.length === 0) {
            container.innerHTML = '<div class="unified-stats-card"><p class="no-data">No regional power data available</p></div>';
            return;
        }

        let html = '<div class="unified-stats-card">';
        
        if (regions.length > 1) {
            html += '<div class="unified-tabs">';
            
            // Tab buttons
            html += '<div class="unified-tab-buttons">';
            regions.forEach((region, index) => {
                html += `<button class="unified-tab-btn ${index === 0 ? 'active' : ''}" data-region="${region}">${region}</button>`;
            });
            html += '</div>';
            
            // Tab content
            html += '<div class="unified-tab-content">';
            regions.forEach((region, index) => {
                html += `<div class="unified-tab-pane ${index === 0 ? 'active' : ''}" data-region="${region}">`;
                html += this.generateRegionPowerContent(regionPowerData[region]);
                html += '</div>';
            });
            html += '</div></div>';
        } else {
            html += '<div class="single-region">';
            html += this.generateRegionPowerContent(regionPowerData[regions[0]]);
            html += '</div>';
        }
        
        html += '</div>';
        container.innerHTML = html;

        // Initialize tab switching
        this.initializePowerTabs(container);
    }

    /**
     * Generate region power content
     * @param {Object} regionData - Region power data
     * @returns {string} HTML content
     */
    generateRegionPowerContent(regionData) {
        return `
            <div class="region-power-content">
                <div class="region-power-summary">
                    <div class="region-metric">
                        <span class="metric-label">Total Energy:</span>
                        <span class="metric-value">${regionData.totalEnergyKwh.toFixed(2)} kWh</span>
                    </div>
                    <div class="region-metric">
                        <span class="metric-label">Total Cost:</span>
                        <span class="metric-value">$${regionData.totalCost.toFixed(2)}</span>
                    </div>
                    <div class="region-metric">
                        <span class="metric-label">Devices:</span>
                        <span class="metric-value">${regionData.deviceCount}</span>
                    </div>
                    <div class="region-metric">
                        <span class="metric-label">Avg Power:</span>
                        <span class="metric-value">${regionData.avgPowerDraw.toFixed(1)} W</span>
                    </div>
                </div>
                <div class="region-power-chart">
                    <canvas class="region-power-canvas" data-region="${regionData.region}"></canvas>
                </div>
            </div>
        `;
    }

    /**
     * Display user power impact
     * @param {Array} userPowerData - User power impact data
     */
    displayUserPowerImpact(userPowerData) {
        const container = document.getElementById('userPowerImpact');
        if (!container) return;

        if (userPowerData.length === 0) {
            container.innerHTML = '<div class="unified-stats-card"><p class="no-data">No user power data available</p></div>';
            return;
        }

        let html = '<div class="unified-stats-card"><div class="power-user-list">';
        
        userPowerData.forEach((user, index) => {
            const efficiencyClass = user.powerEfficiencyScore > 80 ? 'high-efficiency' : 
                                  user.powerEfficiencyScore > 60 ? 'medium-efficiency' : 'low-efficiency';
            
            html += `
                <div class="power-user-item ${efficiencyClass}">
                    <div class="user-rank">${index + 1}</div>
                    <div class="user-info">
                        <div class="user-name">${user.user}</div>
                        <div class="user-power-score">
                            <span class="score-label">Efficiency:</span>
                            <span class="score-value">${user.powerEfficiencyScore}/100</span>
                        </div>
                        <div class="user-metrics">
                            <span class="power-metric energy">${user.totalEnergyKwh.toFixed(2)} kWh</span>
                            <span class="power-metric cost">$${user.totalCost.toFixed(2)}</span>
                            <span class="power-metric carbon">${user.carbonFootprint.toFixed(2)} kg CO₂</span>
                            <span class="power-metric reservations">${user.reservationCount} reservations</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
        container.innerHTML = html;
    }

    /**
     * Display power efficiency metrics
     * @param {Object} efficiencyData - Power efficiency data
     */
    displayPowerEfficiency(efficiencyData) {
        const container = document.getElementById('powerEfficiency');
        if (!container) return;

        let html = '<div class="unified-stats-card">';
        html += '<div class="efficiency-content">';
        
        // Overall efficiency gauge
        html += `
            <div class="efficiency-gauge">
                <div class="gauge-container">
                    <div class="gauge-fill" style="transform: rotate(${(efficiencyData.overallEfficiency / 100) * 180}deg)"></div>
                    <div class="gauge-center">
                        <div class="gauge-value">${efficiencyData.overallEfficiency}%</div>
                        <div class="gauge-label">Overall Efficiency</div>
                    </div>
                </div>
            </div>
        `;
        
        // Efficiency tips
        html += `
            <div class="efficiency-tips">
                <h4>Power Efficiency Insights</h4>
                <ul>
                    <li>Overall system efficiency: ${efficiencyData.overallEfficiency}%</li>
                    <li>${this.getEfficiencyTip(efficiencyData.overallEfficiency)}</li>
                    <li>Monitor peak usage times to optimize scheduling</li>
                    <li>Consider power-efficient alternatives for high-consumption devices</li>
                </ul>
            </div>
        `;
        
        html += '</div></div>';
        container.innerHTML = html;
    }

    /**
     * Display cost analysis
     * @param {Object} costData - Cost analysis data
     */
    displayCostAnalysis(costData) {
        const container = document.getElementById('costAnalysis');
        if (!container) return;

        let html = '<div class="unified-stats-card">';
        html += '<div class="cost-analysis-content">';
        
        // Cost breakdown
        html += `
            <div class="cost-breakdown">
                <div class="cost-item">
                    <span class="cost-label">Current Period Total:</span>
                    <span class="cost-value">$${costData.totalCost}</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Projected Monthly:</span>
                    <span class="cost-value">$${costData.projectedMonthlyCost}</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Projected Yearly:</span>
                    <span class="cost-value">$${costData.projectedYearlyCost}</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Rate per kWh:</span>
                    <span class="cost-value">$${costData.avgCostPerKwh}</span>
                </div>
            </div>
        `;
        
        // Cost by region chart
        if (Object.keys(costData.costByRegion).length > 0) {
            html += '<div class="cost-chart-container">';
            html += '<canvas class="cost-chart"></canvas>';
            html += '</div>';
        }
        
        html += '</div></div>';
        container.innerHTML = html;

        // Create cost chart
        this.createCostChart(container, costData);
    }

    /**
     * Display power trends
     * @param {Object} trendsData - Power trends data
     */
    displayPowerTrends(trendsData) {
        const container = document.getElementById('powerTrends');
        if (!container) return;

        let html = '<div class="unified-stats-card">';
        html += '<div class="trends-content">';
        
        // Monthly trends chart
        if (trendsData.monthlyTrends.length > 0) {
            html += '<div class="trends-chart-container">';
            html += '<h4>Monthly Power Consumption Trends</h4>';
            html += '<canvas class="monthly-trends-chart"></canvas>';
            html += '</div>';
        }
        
        // Daily trends (last 30 days)
        if (trendsData.dailyTrends.length > 0) {
            html += '<div class="trends-chart-container">';
            html += '<h4>Daily Power Usage (Last 30 Days)</h4>';
            html += '<canvas class="daily-trends-chart"></canvas>';
            html += '</div>';
        }
        
        html += '</div></div>';
        container.innerHTML = html;

        // Create trend charts
        this.createTrendCharts(container, trendsData);
    }

    /**
     * Initialize power tab switching
     * @param {HTMLElement} container - Container element
     */
    initializePowerTabs(container) {
        const tabButtons = container.querySelectorAll('.unified-tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const region = e.target.dataset.region;
                
                // Update buttons
                container.querySelectorAll('.unified-tab-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.region === region);
                });

                // Update panes
                container.querySelectorAll('.unified-tab-pane').forEach(pane => {
                    pane.classList.toggle('active', pane.dataset.region === region);
                });
            });
        });
    }

    /**
     * Create cost chart
     * @param {HTMLElement} container - Container element
     * @param {Object} costData - Cost data
     */
    createCostChart(container, costData) {
        const canvas = container.querySelector('.cost-chart');
        if (!canvas || Object.keys(costData.costByRegion).length === 0) return;

        const ctx = canvas.getContext('2d');
        const regions = Object.keys(costData.costByRegion);
        const costs = Object.values(costData.costByRegion);

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: regions,
                datasets: [{
                    data: costs,
                    backgroundColor: [
                        '#333', '#555', '#777', '#999', '#bbb'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        this.charts.set('costChart', chart);
    }

    /**
     * Create trend charts
     * @param {HTMLElement} container - Container element
     * @param {Object} trendsData - Trends data
     */
    createTrendCharts(container, trendsData) {
        // Monthly trends chart
        const monthlyCanvas = container.querySelector('.monthly-trends-chart');
        if (monthlyCanvas && trendsData.monthlyTrends.length > 0) {
            const ctx = monthlyCanvas.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trendsData.monthlyTrends.map(t => t.month),
                    datasets: [{
                        label: 'Energy (kWh)',
                        data: trendsData.monthlyTrends.map(t => t.totalEnergyKwh),
                        borderColor: '#333',
                        backgroundColor: 'rgba(51, 51, 51, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Cost ($)',
                        data: trendsData.monthlyTrends.map(t => t.totalCost),
                        borderColor: '#666',
                        backgroundColor: 'rgba(102, 102, 102, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false,
                            },
                        }
                    }
                }
            });
            this.charts.set('monthlyTrends', chart);
        }

        // Daily trends chart
        const dailyCanvas = container.querySelector('.daily-trends-chart');
        if (dailyCanvas && trendsData.dailyTrends.length > 0) {
            const ctx = dailyCanvas.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: trendsData.dailyTrends.map(t => t.date.slice(-5)), // MM-DD
                    datasets: [{
                        label: 'Daily Energy (kWh)',
                        data: trendsData.dailyTrends.map(t => t.totalEnergyKwh),
                        backgroundColor: '#333',
                        borderColor: '#555',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            this.charts.set('dailyTrends', chart);
        }
    }

    /**
     * Get efficiency tip based on score
     * @param {number} efficiency - Efficiency percentage
     * @returns {string} Efficiency tip
     */
    getEfficiencyTip(efficiency) {
        if (efficiency >= 80) {
            return "Excellent efficiency! Your equipment is well-utilized.";
        } else if (efficiency >= 60) {
            return "Good efficiency. Consider optimizing high-power devices.";
        } else if (efficiency >= 40) {
            return "Moderate efficiency. Review device usage patterns.";
        } else {
            return "Low efficiency detected. Significant optimization opportunities available.";
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
        if (this.powerContent) {
            this.powerContent.style.display = 'none';
        }
        
        this.showNoDataMessage();
    }

    /**
     * Resize charts
     */
    resizeCharts() {
        this.charts.forEach(chart => {
            chart.resize();
        });
    }
}