// Statistics Display Component - Handles statistics visualization and charts
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
        
        console.log('StatisticsDisplay component initialized');
    }

    /**
     * Display statistics data
     * @param {Object} statistics - Statistics data object
     */
    displayStatistics(statistics) {
        if (!this.statsContent) return;

        this.showStatsContent();
        
        // Display different sections
        this.displayTopDevicesChart(statistics.topDevices);
        this.displayTopUsersTable(statistics.topUsers);
        this.displayUtilizationRates(statistics.utilizationRates);
        this.displayLeastReservedDevices(statistics.leastReservedDevices);
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
     * Display top devices chart
     * @param {Object} topDevices - Top devices data by region
     */
    displayTopDevicesChart(topDevices) {
        const chartContainer = document.getElementById('topDevicesChart');
        if (!chartContainer) return;

        // Clear existing chart
        chartContainer.innerHTML = '';

        // Get first region's data for the chart (or combine all regions)
        const regions = Object.keys(topDevices);
        if (regions.length === 0) return;

        // Combine data from all regions
        const combinedData = {};
        regions.forEach(region => {
            topDevices[region].forEach(device => {
                if (!combinedData[device.device]) {
                    combinedData[device.device] = {
                        device: device.device,
                        count: 0,
                        totalDays: 0
                    };
                }
                combinedData[device.device].count += device.count;
                combinedData[device.device].totalDays += device.totalDays;
            });
        });

        // Convert to array and sort
        const chartData = Object.values(combinedData)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Create chart
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.map(item => item.device),
                datasets: [{
                    label: 'Reservations',
                    data: chartData.map(item => item.count),
                    backgroundColor: '#333',
                    borderColor: '#555',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });

        this.charts.set('topDevices', chart);
    }

    /**
     * Display top users table
     * @param {Array} topUsers - Top users data
     */
    displayTopUsersTable(topUsers) {
        const tableBody = document.querySelector('#topUsersTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        topUsers.forEach((user, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="rank">${index + 1}</span></td>
                <td>${user.user}</td>
                <td>${user.uniqueDevices}</td>
                <td>${user.totalDays}</td>
                <td>${user.avgDuration} days</td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * Display utilization rates
     * @param {Object} utilizationRates - Utilization rates by region
     */
    displayUtilizationRates(utilizationRates) {
        const tabsContainer = document.getElementById('utilizationTabs');
        const contentContainer = document.getElementById('utilizationTabContent');
        
        if (!tabsContainer || !contentContainer) return;

        // Clear existing content
        tabsContainer.innerHTML = '';
        contentContainer.innerHTML = '';

        const regions = Object.keys(utilizationRates);
        
        regions.forEach((region, index) => {
            // Create tab button
            const tabBtn = document.createElement('button');
            tabBtn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            tabBtn.textContent = region;
            tabBtn.addEventListener('click', () => {
                this.switchTab('utilization', region, tabBtn);
            });
            tabsContainer.appendChild(tabBtn);

            // Create tab content
            const tabPane = document.createElement('div');
            tabPane.className = `tab-pane ${index === 0 ? 'active' : ''}`;
            tabPane.id = `utilization-${region}`;
            
            const devices = utilizationRates[region].slice(0, 10); // Top 10
            
            let content = '<div class="utilization-list">';
            devices.forEach(device => {
                content += `
                    <div class="utilization-item" style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="font-weight: 500;">${device.device}</span>
                            <span style="font-weight: 600;">${device.utilizationRate}%</span>
                        </div>
                        <div class="utilization-bar">
                            <div class="utilization-fill" style="width: ${Math.min(device.utilizationRate, 100)}%"></div>
                        </div>
                        <div style="font-size: 0.8em; color: #666; margin-top: 2px;">
                            ${device.reservationCount} reservations • ${device.reservedDays} days
                        </div>
                    </div>
                `;
            });
            content += '</div>';
            
            tabPane.innerHTML = content;
            contentContainer.appendChild(tabPane);
        });
    }

    /**
     * Display least reserved devices
     * @param {Object} leastReservedDevices - Least reserved devices by region
     */
    displayLeastReservedDevices(leastReservedDevices) {
        const tabsContainer = document.getElementById('leastReservedTabs');
        const contentContainer = document.getElementById('leastReservedTabContent');
        
        if (!tabsContainer || !contentContainer) return;

        // Clear existing content
        tabsContainer.innerHTML = '';
        contentContainer.innerHTML = '';

        const regions = Object.keys(leastReservedDevices);
        
        regions.forEach((region, index) => {
            // Create tab button
            const tabBtn = document.createElement('button');
            tabBtn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            tabBtn.textContent = region;
            tabBtn.addEventListener('click', () => {
                this.switchTab('leastReserved', region, tabBtn);
            });
            tabsContainer.appendChild(tabBtn);

            // Create tab content
            const tabPane = document.createElement('div');
            tabPane.className = `tab-pane ${index === 0 ? 'active' : ''}`;
            tabPane.id = `leastReserved-${region}`;
            
            const devices = leastReservedDevices[region];
            
            let content = '<div class="least-reserved-list">';
            if (devices.length === 0) {
                content += '<p style="color: #666; font-style: italic;">No data available for this region.</p>';
            } else {
                devices.forEach((device, deviceIndex) => {
                    content += `
                        <div class="least-reserved-item" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            <div>
                                <div style="font-weight: 500;">${device.device}</div>
                                <div style="font-size: 0.8em; color: #666;">
                                    Avg duration: ${device.avgDuration} days
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 600; color: #dc3545;">${device.count} reservations</div>
                                <div style="font-size: 0.8em; color: #666;">${device.totalDays} total days</div>
                            </div>
                        </div>
                    `;
                });
            }
            content += '</div>';
            
            tabPane.innerHTML = content;
            contentContainer.appendChild(tabPane);
        });
    }

    /**
     * Switch between tabs
     * @param {string} section - Section name (utilization or leastReserved)
     * @param {string} region - Region name
     * @param {HTMLElement} clickedTab - Clicked tab element
     */
    switchTab(section, region, clickedTab) {
        const tabsContainer = clickedTab.parentNode;
        const contentContainer = tabsContainer.nextElementSibling;

        // Remove active class from all tabs and panes
        tabsContainer.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        contentContainer.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        // Add active class to clicked tab and corresponding pane
        clickedTab.classList.add('active');
        const targetPane = contentContainer.querySelector(`#${section}-${region}`);
        if (targetPane) {
            targetPane.classList.add('active');
        }
    }

    /**
     * Export statistics to CSV
     * @param {Object} statistics - Statistics data
     */
    exportStatisticsToCSV(statistics) {
        const csvData = [];
        
        // Add headers
        csvData.push(['Section', 'Region', 'Item', 'Value1', 'Value2', 'Value3']);

        // Add top devices data
        Object.entries(statistics.topDevices).forEach(([region, devices]) => {
            devices.forEach(device => {
                csvData.push([
                    'Top Devices',
                    region,
                    device.device,
                    device.count,
                    device.totalDays,
                    device.avgDuration
                ]);
            });
        });

        // Add top users data
        statistics.topUsers.forEach(user => {
            csvData.push([
                'Top Users',
                'All',
                user.user,
                user.reservationCount,
                user.totalDays,
                user.avgDuration
            ]);
        });

        // Convert to CSV string
        const csvString = csvData.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');

        // Download file
        this.downloadCSV(csvString, 'lab_statistics.csv');
    }

    /**
     * Download CSV file
     * @param {string} csvString - CSV content
     * @param {string} filename - File name
     */
    downloadCSV(csvString, filename) {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
     * Resize charts (useful for responsive design)
     */
    resizeCharts() {
        this.charts.forEach(chart => {
            chart.resize();
        });
    }

    /**
     * Get display state
     * @returns {Object} Display state information
     */
    getDisplayState() {
        return {
            isVisible: this.statsContent && this.statsContent.style.display !== 'none',
            chartCount: this.charts.size,
            charts: Array.from(this.charts.keys())
        };
    }
}