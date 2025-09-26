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
        
        // Display all sections using unified card system
        this.displayTopDevicesCard(statistics.topDevices);
        this.displayTopUsersCard(statistics.topUsers);
        this.displayUtilizationCard(statistics.utilizationRates);
        this.displayLeastReservedCard(statistics.leastReservedDevices);
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
     * Display top devices using unified card system
     * @param {Object} topDevices - Top devices data by region
     */
    displayTopDevicesCard(topDevices) {
        console.log('displayTopDevicesCard called with:', topDevices);
        
        const container = document.getElementById('topDevicesChart');
        if (!container) {
            console.error('Container topDevicesChart not found');
            return;
        }

        const regions = Object.keys(topDevices);
        console.log('Regions found:', regions);
        
        if (regions.length === 0) {
            container.innerHTML = '<div class="unified-stats-card"><p class="no-data">No data available</p></div>';
            return;
        }

        // Use the working legacy method but wrap it in unified styling
        container.innerHTML = '<div class="unified-stats-card"><div class="chart-section" style="height: 300px; padding: 20px;"></div></div>';
        
        // Get the chart section and create a temporary container for the legacy method
        const chartSection = container.querySelector('.chart-section');
        chartSection.id = 'tempChartContainer';
        
        // Call the legacy method that we know works
        this.displayTopDevicesChartInContainer('tempChartContainer', topDevices);
    }

    /**
     * Display top devices chart (legacy method for chart creation)
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
     * Display top users using unified card system
     * @param {Array} topUsers - Top users data
     */
    displayTopUsersCard(topUsers) {
        this.displayListDataCard('topUsersTable', topUsers, {
            title: 'Top Active Users',
            type: 'ranked-list',
            showRanking: true,
            showMetrics: true,
            showRankingScore: true,
            metrics: ['uniqueDevices', 'totalDays', 'avgDuration', 'rankingScore']
        });
    }

    /**
     * Display top users table (legacy method)
     * @param {Array} topUsers - Top users data
     */
    displayTopUsersTable(topUsers) {
        const tableBody = document.querySelector('#topUsersTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        topUsers.forEach((user, index) => {
            const row = document.createElement('tr');
            const rankingScore = user.rankingScore !== undefined ? 
                `<span class="ranking-score-badge">${user.rankingScore}/100</span>` : '';
            
            row.innerHTML = `
                <td><span class="rank">${index + 1}</span></td>
                <td>${user.user} ${rankingScore}</td>
                <td>${user.uniqueDevices}</td>
                <td>${user.totalDays}</td>
                <td>${user.avgDuration} days</td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * Display utilization rates using unified card system
     * @param {Object} utilizationRates - Utilization rates by region
     */
    displayUtilizationCard(utilizationRates) {
        this.displayRegionalDataCard('utilizationTabs', utilizationRates, {
            title: 'Equipment Utilization by Region',
            type: 'progress-list',
            showProgress: true,
            showMetrics: true,
            progressField: 'utilizationRate'
        });
    }

    /**
     * Display utilization rates (legacy method)
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
     * Display least reserved devices using unified card system
     * @param {Object} leastReservedDevices - Least reserved devices by region
     */
    displayLeastReservedCard(leastReservedDevices) {
        this.displayRegionalDataCard('leastReservedTabs', leastReservedDevices, {
            title: 'Least Reserved Devices by Region',
            type: 'metric-list',
            showMetrics: true,
            highlightLow: true
        });
    }

    /**
     * Display least reserved devices (legacy method)
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
     * Unified method to display regional data cards
     * @param {string} containerId - Container element ID
     * @param {Object} data - Regional data object
     * @param {Object} options - Display options
     */
    displayRegionalDataCard(containerId, data, options) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const regions = Object.keys(data);
        if (regions.length === 0) {
            container.innerHTML = '<p class="no-data">No data available</p>';
            return;
        }

        // Create unified card structure
        let html = '<div class="unified-stats-card">';
        
        if (options.showChart && options.type === 'chart') {
            html += this.generateChartSection(data);
        } else if (regions.length > 1) {
            html += this.generateTabbedSection(data, options);
        } else {
            html += this.generateSingleRegionSection(data[regions[0]], options);
        }
        
        html += '</div>';
        container.innerHTML = html;

        // Initialize interactive elements
        this.initializeCardInteractions(containerId, options);
    }

    /**
     * Unified method to display list data cards
     * @param {string} containerId - Container element ID
     * @param {Array} data - List data array
     * @param {Object} options - Display options
     */
    displayListDataCard(containerId, data, options) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = '<p class="no-data">No data available</p>';
            return;
        }

        let html = '<div class="unified-stats-card">';
        html += '<div class="stats-list">';
        
        data.forEach((item, index) => {
            html += this.generateListItem(item, index, options);
        });
        
        html += '</div></div>';
        container.innerHTML = html;
    }

    /**
     * Generate chart section HTML
     * @param {Object} data - Chart data
     * @returns {string} HTML string
     */
    generateChartSection(data) {
        return '<div class="chart-section"><canvas class="stats-chart"></canvas></div>';
    }

    /**
     * Generate tabbed section HTML
     * @param {Object} data - Regional data
     * @param {Object} options - Display options
     * @returns {string} HTML string
     */
    generateTabbedSection(data, options) {
        const regions = Object.keys(data);
        let html = '<div class="unified-tabs">';
        
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
            html += this.generateRegionContent(data[region], options);
            html += '</div>';
        });
        html += '</div></div>';
        
        return html;
    }

    /**
     * Generate single region section HTML
     * @param {Array} regionData - Single region data
     * @param {Object} options - Display options
     * @returns {string} HTML string
     */
    generateSingleRegionSection(regionData, options) {
        return '<div class="single-region">' + this.generateRegionContent(regionData, options) + '</div>';
    }

    /**
     * Generate content for a region
     * @param {Array} regionData - Region data array
     * @param {Object} options - Display options
     * @returns {string} HTML string
     */
    generateRegionContent(regionData, options) {
        let html = '<div class="region-content">';
        
        regionData.slice(0, 10).forEach((item, index) => {
            html += this.generateDataItem(item, index, options);
        });
        
        html += '</div>';
        return html;
    }

    /**
     * Generate individual data item HTML
     * @param {Object} item - Data item
     * @param {number} index - Item index
     * @param {Object} options - Display options
     * @returns {string} HTML string
     */
    generateDataItem(item, index, options) {
        const itemName = item.device || item.user || 'Unknown';
        let html = '<div class="unified-data-item">';
        
        // Ranking
        if (options.showRanking) {
            html += `<div class="item-rank">${index + 1}</div>`;
        }
        
        // Main content
        html += '<div class="item-content">';
        html += `<div class="item-name">${itemName}</div>`;
        
        // Progress bar for utilization
        if (options.showProgress && item[options.progressField] !== undefined) {
            const value = item[options.progressField];
            html += `<div class="item-progress">`;
            html += `<div class="progress-bar"><div class="progress-fill" style="width: ${Math.min(value, 100)}%"></div></div>`;
            html += `<div class="progress-label">${value}%</div>`;
            html += `</div>`;
        }
        
        // Ranking Score (prominent display)
        if (options.showRankingScore && item.rankingScore !== undefined) {
            html += `<div class="item-ranking-score">
                <span class="ranking-score-label">Score:</span>
                <span class="ranking-score-value">${item.rankingScore}/100</span>
            </div>`;
        }

        // Metrics
        if (options.showMetrics) {
            html += '<div class="item-metrics">';
            if (item.count !== undefined) html += `<span class="metric">${item.count} reservations</span>`;
            if (item.totalDays !== undefined) html += `<span class="metric">${item.totalDays} days</span>`;
            if (item.avgDuration !== undefined) html += `<span class="metric">Avg: ${item.avgDuration} days</span>`;
            if (item.uniqueDevices !== undefined) html += `<span class="metric">${item.uniqueDevices} devices</span>`;
            if (item.uniqueUsers !== undefined) html += `<span class="metric">${item.uniqueUsers} users</span>`;
            if (item.reservationCount !== undefined) html += `<span class="metric">${item.reservationCount} reservations</span>`;
            html += '</div>';
        }
        
        html += '</div></div>';
        return html;
    }

    /**
     * Generate list item HTML
     * @param {Object} item - List item data
     * @param {number} index - Item index
     * @param {Object} options - Display options
     * @returns {string} HTML string
     */
    generateListItem(item, index, options) {
        return this.generateDataItem(item, index, options);
    }

    /**
     * Initialize card interactions
     * @param {string} containerId - Container ID
     * @param {Object} options - Display options
     */
    initializeCardInteractions(containerId, options) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Initialize tab switching
        const tabButtons = container.querySelectorAll('.unified-tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchUnifiedTab(container, e.target.dataset.region);
            });
        });

        // Initialize chart if needed
        if (options.showChart) {
            const canvas = container.querySelector('.stats-chart');
            if (canvas) {
                this.createUnifiedChart(canvas, options);
            }
        }
    }

    /**
     * Switch unified tabs
     * @param {HTMLElement} container - Container element
     * @param {string} region - Target region
     */
    switchUnifiedTab(container, region) {
        // Update buttons
        container.querySelectorAll('.unified-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.region === region);
        });

        // Update panes
        container.querySelectorAll('.unified-tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.dataset.region === region);
        });
    }

    /**
     * Create top devices chart with unified styling
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Object} topDevices - Top devices data by region
     */
    createTopDevicesChartUnified(canvas, topDevices) {
        console.log('createTopDevicesChartUnified called with:', topDevices);
        
        // Combine data from all regions
        const combinedData = {};
        const regions = Object.keys(topDevices);
        
        console.log('Processing regions:', regions);
        
        regions.forEach(region => {
            console.log(`Processing region ${region} with devices:`, topDevices[region]);
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

        console.log('Chart data prepared:', chartData);

        if (chartData.length === 0) {
            console.warn('No chart data available');
            canvas.parentElement.innerHTML = '<p class="no-data">No chart data available</p>';
            return;
        }

        // Create chart with unified styling
        const ctx = canvas.getContext('2d');
        console.log('Creating Chart.js chart...');
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.map(item => item.device),
                datasets: [{
                    label: 'Reservations',
                    data: chartData.map(item => item.count),
                    backgroundColor: '#333',
                    borderColor: '#555',
                    borderWidth: 1,
                    borderRadius: 4
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
                            stepSize: 1,
                            color: '#666'
                        },
                        grid: {
                            color: '#e9ecef'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            color: '#666'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        console.log('Chart created successfully:', chart);
        this.charts.set('topDevicesUnified', chart);
    }

    /**
     * Create unified chart (legacy method)
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Object} options - Chart options
     */
    createUnifiedChart(canvas, options) {
        // This method is kept for future unified chart implementations
        console.log('Creating unified chart', options);
    }

    /**
     * Create top devices chart with unified styling
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Object} data - Chart data
     */
    createTopDevicesChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Reservations',
                    data: data.values,
                    backgroundColor: '#333',
                    borderColor: '#555',
                    borderWidth: 1,
                    borderRadius: 4
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
                            stepSize: 1,
                            color: '#666'
                        },
                        grid: {
                            color: '#e9ecef'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            color: '#666'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        this.charts.set('topDevicesUnified', chart);
    }

    /**
     * Display top devices chart in a specific container (helper method)
     * @param {string} containerId - Container ID
     * @param {Object} topDevices - Top devices data by region
     */
    displayTopDevicesChartInContainer(containerId, topDevices) {
        const chartContainer = document.getElementById(containerId);
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
        canvas.style.width = '100%';
        canvas.style.height = '100%';
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
                    borderWidth: 1,
                    borderRadius: 4
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
                            stepSize: 1,
                            color: '#666'
                        },
                        grid: {
                            color: '#e9ecef'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            color: '#666'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        this.charts.set('topDevicesUnified', chart);
    }

    /**
     * Get top devices data formatted for chart
     * @returns {Object|null} Chart data object
     */
    getTopDevicesDataForChart() {
        // This would be populated by the display method
        // For now, return null to prevent errors
        return null;
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