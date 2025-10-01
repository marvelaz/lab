// Power Usage Service - Handles power consumption data and calculations
class PowerUsageService {
    constructor() {
        this.cache = new Map();
        this.netboxBaseUrl = null; // To be configured
        this.apcBaseUrl = null;    // To be configured
        this.powerData = new Map(); // Cache for power readings
    }

    /**
     * Initialize power service with configuration
     * @param {Object} config - Configuration object
     */
    init(config) {
        this.netboxBaseUrl = config.netboxUrl;
        this.apcBaseUrl = config.apcUrl;
        this.apiKeys = config.apiKeys || {};
        
        console.log('PowerUsageService initialized');
    }

    /**
     * Generate power usage statistics
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Object} Power statistics object
     */
    async generatePowerStatistics(reservations) {
        const cacheKey = this.generateCacheKey(reservations);
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Get device power specifications from NetBox
            const deviceSpecs = await this.getDevicePowerSpecs(reservations);
            
            // Get actual power consumption from APC outlets
            const powerReadings = await this.getPowerReadings(reservations);
            
            // Calculate power statistics
            const statistics = {
                devicePowerConsumption: this.calculateDevicePowerConsumption(reservations, deviceSpecs, powerReadings),
                regionPowerUsage: this.calculateRegionPowerUsage(reservations, deviceSpecs, powerReadings),
                userPowerImpact: this.calculateUserPowerImpact(reservations, deviceSpecs, powerReadings),
                powerEfficiency: this.calculatePowerEfficiency(reservations, deviceSpecs, powerReadings),
                costAnalysis: this.calculatePowerCosts(reservations, deviceSpecs, powerReadings),
                powerTrends: this.calculatePowerTrends(reservations, deviceSpecs, powerReadings),
                summary: this.getPowerSummary(reservations, deviceSpecs, powerReadings)
            };

            this.cache.set(cacheKey, statistics);
            return statistics;
            
        } catch (error) {
            console.error('Error generating power statistics:', error);
            return this.getEmptyPowerStatistics();
        }
    }

    /**
     * Get device power specifications from NetBox
     * @param {Reservation[]} reservations - Reservations to get specs for
     * @returns {Map} Device power specifications
     */
    async getDevicePowerSpecs(reservations) {
        const deviceSpecs = new Map();
        const uniqueDevices = [...new Set(reservations.map(r => r.device))];

        // Mock data for demonstration - replace with actual NetBox API calls
        for (const device of uniqueDevices) {
            deviceSpecs.set(device, {
                device: device,
                maxPowerDraw: this.estimateMaxPowerDraw(device), // Watts
                typicalPowerDraw: this.estimateTypicalPowerDraw(device), // Watts
                powerType: this.getPowerType(device),
                rackLocation: this.getRackLocation(device),
                powerOutlet: this.getPowerOutlet(device)
            });
        }

        return deviceSpecs;
    }

    /**
     * Get actual power readings from APC outlets
     * @param {Reservation[]} reservations - Reservations to get readings for
     * @returns {Map} Power readings by device and time
     */
    async getPowerReadings(reservations) {
        const powerReadings = new Map();

        // Mock data for demonstration - replace with actual APC API calls
        for (const reservation of reservations) {
            const readingKey = `${reservation.device}_${reservation.id}`;
            powerReadings.set(readingKey, {
                device: reservation.device,
                reservationId: reservation.id,
                startDate: reservation.startDate,
                endDate: reservation.endDate,
                avgPowerDraw: this.generateMockPowerReading(reservation.device),
                peakPowerDraw: this.generateMockPeakPowerReading(reservation.device),
                totalEnergyKwh: this.calculateTotalEnergy(reservation),
                powerFactor: 0.85 + Math.random() * 0.1, // 0.85-0.95
                readings: this.generateMockHourlyReadings(reservation)
            });
        }

        return powerReadings;
    }

    /**
     * Calculate device power consumption statistics
     * @param {Reservation[]} reservations - Reservations data
     * @param {Map} deviceSpecs - Device specifications
     * @param {Map} powerReadings - Power readings
     * @returns {Object} Device power consumption data
     */
    calculateDevicePowerConsumption(reservations, deviceSpecs, powerReadings) {
        const deviceStats = {};

        reservations.forEach(reservation => {
            const device = reservation.device;
            const readingKey = `${device}_${reservation.id}`;
            const reading = powerReadings.get(readingKey);
            const spec = deviceSpecs.get(device);

            if (!deviceStats[device]) {
                deviceStats[device] = {
                    device: device,
                    totalEnergyKwh: 0,
                    totalHours: 0,
                    avgPowerDraw: 0,
                    peakPowerDraw: 0,
                    reservationCount: 0,
                    estimatedCost: 0,
                    efficiency: 0,
                    maxPowerSpec: spec?.maxPowerDraw || 0
                };
            }

            if (reading) {
                deviceStats[device].totalEnergyKwh += reading.totalEnergyKwh;
                deviceStats[device].totalHours += reservation.getDurationInDays() * 24;
                deviceStats[device].avgPowerDraw = (deviceStats[device].avgPowerDraw * deviceStats[device].reservationCount + reading.avgPowerDraw) / (deviceStats[device].reservationCount + 1);
                deviceStats[device].peakPowerDraw = Math.max(deviceStats[device].peakPowerDraw, reading.peakPowerDraw);
                deviceStats[device].reservationCount++;
                deviceStats[device].estimatedCost += reading.totalEnergyKwh * CONFIG.POWER.COST_PER_KWH;
                deviceStats[device].efficiency = spec ? (reading.avgPowerDraw / spec.maxPowerDraw) * 100 : 0;
            }
        });

        // Convert to sorted array
        return Object.values(deviceStats)
            .sort((a, b) => b.totalEnergyKwh - a.totalEnergyKwh)
            .slice(0, CONFIG.STATS.TOP_ITEMS_LIMIT);
    }

    /**
     * Calculate region power usage
     * @param {Reservation[]} reservations - Reservations data
     * @param {Map} deviceSpecs - Device specifications
     * @param {Map} powerReadings - Power readings
     * @returns {Object} Region power usage data
     */
    calculateRegionPowerUsage(reservations, deviceSpecs, powerReadings) {
        const regionStats = {};

        reservations.forEach(reservation => {
            const region = reservation.labRegion;
            const readingKey = `${reservation.device}_${reservation.id}`;
            const reading = powerReadings.get(readingKey);

            if (!regionStats[region]) {
                regionStats[region] = {
                    region: region,
                    totalEnergyKwh: 0,
                    totalCost: 0,
                    deviceCount: new Set(),
                    avgPowerDraw: 0,
                    peakPowerDraw: 0,
                    reservationCount: 0
                };
            }

            if (reading) {
                regionStats[region].totalEnergyKwh += reading.totalEnergyKwh;
                regionStats[region].totalCost += reading.totalEnergyKwh * CONFIG.POWER.COST_PER_KWH;
                regionStats[region].deviceCount.add(reservation.device);
                regionStats[region].avgPowerDraw = (regionStats[region].avgPowerDraw * regionStats[region].reservationCount + reading.avgPowerDraw) / (regionStats[region].reservationCount + 1);
                regionStats[region].peakPowerDraw = Math.max(regionStats[region].peakPowerDraw, reading.peakPowerDraw);
                regionStats[region].reservationCount++;
            }
        });

        // Convert sets to counts and return object
        const result = {};
        Object.keys(regionStats).forEach(region => {
            result[region] = {
                ...regionStats[region],
                deviceCount: regionStats[region].deviceCount.size
            };
        });

        return result;
    }

    /**
     * Calculate user power impact
     * @param {Reservation[]} reservations - Reservations data
     * @param {Map} deviceSpecs - Device specifications
     * @param {Map} powerReadings - Power readings
     * @returns {Array} User power impact data
     */
    calculateUserPowerImpact(reservations, deviceSpecs, powerReadings) {
        const userStats = {};

        reservations.forEach(reservation => {
            const user = reservation.requestedBy;
            const readingKey = `${reservation.device}_${reservation.id}`;
            const reading = powerReadings.get(readingKey);

            if (!userStats[user]) {
                userStats[user] = {
                    user: user,
                    totalEnergyKwh: 0,
                    totalCost: 0,
                    avgPowerDraw: 0,
                    reservationCount: 0,
                    carbonFootprint: 0,
                    powerEfficiencyScore: 0
                };
            }

            if (reading) {
                userStats[user].totalEnergyKwh += reading.totalEnergyKwh;
                userStats[user].totalCost += reading.totalEnergyKwh * CONFIG.POWER.COST_PER_KWH;
                userStats[user].avgPowerDraw = (userStats[user].avgPowerDraw * userStats[user].reservationCount + reading.avgPowerDraw) / (userStats[user].reservationCount + 1);
                userStats[user].reservationCount++;
                userStats[user].carbonFootprint += reading.totalEnergyKwh * CONFIG.POWER.CO2_PER_KWH;
            }
        });

        // Calculate power efficiency scores for users
        Object.values(userStats).forEach(user => {
            user.powerEfficiencyScore = this.calculateUserPowerEfficiency(user);
        });

        return Object.values(userStats)
            .sort((a, b) => b.totalEnergyKwh - a.totalEnergyKwh)
            .slice(0, CONFIG.STATS.TOP_ITEMS_LIMIT);
    }

    /**
     * Calculate power efficiency metrics
     * @param {Reservation[]} reservations - Reservations data
     * @param {Map} deviceSpecs - Device specifications
     * @param {Map} powerReadings - Power readings
     * @returns {Object} Power efficiency data
     */
    calculatePowerEfficiency(reservations, deviceSpecs, powerReadings) {
        const efficiencyData = {
            overallEfficiency: 0,
            deviceEfficiency: {},
            regionEfficiency: {},
            timeBasedEfficiency: {}
        };

        // Calculate overall efficiency
        let totalActualPower = 0;
        let totalMaxPower = 0;
        let validReadings = 0;

        reservations.forEach(reservation => {
            const readingKey = `${reservation.device}_${reservation.id}`;
            const reading = powerReadings.get(readingKey);
            const spec = deviceSpecs.get(reservation.device);

            if (reading && spec) {
                totalActualPower += reading.avgPowerDraw;
                totalMaxPower += spec.maxPowerDraw;
                validReadings++;
            }
        });

        efficiencyData.overallEfficiency = validReadings > 0 ? 
            Math.round((totalActualPower / totalMaxPower) * 100) : 0;

        return efficiencyData;
    }

    /**
     * Calculate power costs
     * @param {Reservation[]} reservations - Reservations data
     * @param {Map} deviceSpecs - Device specifications
     * @param {Map} powerReadings - Power readings
     * @returns {Object} Cost analysis data
     */
    calculatePowerCosts(reservations, deviceSpecs, powerReadings) {
        let totalCost = 0;
        let totalEnergyKwh = 0;
        const costByRegion = {};
        const costByDevice = {};

        reservations.forEach(reservation => {
            const readingKey = `${reservation.device}_${reservation.id}`;
            const reading = powerReadings.get(readingKey);

            if (reading) {
                const cost = reading.totalEnergyKwh * CONFIG.POWER.COST_PER_KWH;
                totalCost += cost;
                totalEnergyKwh += reading.totalEnergyKwh;

                // By region
                if (!costByRegion[reservation.labRegion]) {
                    costByRegion[reservation.labRegion] = 0;
                }
                costByRegion[reservation.labRegion] += cost;

                // By device
                if (!costByDevice[reservation.device]) {
                    costByDevice[reservation.device] = 0;
                }
                costByDevice[reservation.device] += cost;
            }
        });

        return {
            totalCost: Math.round(totalCost * 100) / 100,
            totalEnergyKwh: Math.round(totalEnergyKwh * 100) / 100,
            avgCostPerKwh: CONFIG.POWER.COST_PER_KWH,
            costByRegion,
            costByDevice,
            projectedMonthlyCost: this.projectMonthlyCost(totalCost, reservations),
            projectedYearlyCost: this.projectYearlyCost(totalCost, reservations)
        };
    }

    /**
     * Calculate power trends over time
     * @param {Reservation[]} reservations - Reservations data
     * @param {Map} deviceSpecs - Device specifications
     * @param {Map} powerReadings - Power readings
     * @returns {Object} Power trends data
     */
    calculatePowerTrends(reservations, deviceSpecs, powerReadings) {
        const monthlyTrends = {};
        const dailyTrends = {};

        reservations.forEach(reservation => {
            const readingKey = `${reservation.device}_${reservation.id}`;
            const reading = powerReadings.get(readingKey);

            if (reading) {
                const monthKey = reservation.startDate.toISOString().slice(0, 7); // YYYY-MM
                const dayKey = reservation.startDate.toISOString().slice(0, 10); // YYYY-MM-DD

                // Monthly trends
                if (!monthlyTrends[monthKey]) {
                    monthlyTrends[monthKey] = {
                        month: monthKey,
                        totalEnergyKwh: 0,
                        totalCost: 0,
                        avgPowerDraw: 0,
                        reservationCount: 0
                    };
                }
                monthlyTrends[monthKey].totalEnergyKwh += reading.totalEnergyKwh;
                monthlyTrends[monthKey].totalCost += reading.totalEnergyKwh * CONFIG.POWER.COST_PER_KWH;
                monthlyTrends[monthKey].reservationCount++;

                // Daily trends (last 30 days)
                const daysDiff = (new Date() - reservation.startDate) / (1000 * 60 * 60 * 24);
                if (daysDiff <= 30) {
                    if (!dailyTrends[dayKey]) {
                        dailyTrends[dayKey] = {
                            date: dayKey,
                            totalEnergyKwh: 0,
                            totalCost: 0,
                            peakPowerDraw: 0
                        };
                    }
                    dailyTrends[dayKey].totalEnergyKwh += reading.totalEnergyKwh;
                    dailyTrends[dayKey].totalCost += reading.totalEnergyKwh * CONFIG.POWER.COST_PER_KWH;
                    dailyTrends[dayKey].peakPowerDraw = Math.max(dailyTrends[dayKey].peakPowerDraw, reading.peakPowerDraw);
                }
            }
        });

        return {
            monthlyTrends: Object.values(monthlyTrends).sort((a, b) => a.month.localeCompare(b.month)),
            dailyTrends: Object.values(dailyTrends).sort((a, b) => a.date.localeCompare(b.date))
        };
    }

    /**
     * Get power usage summary
     * @param {Reservation[]} reservations - Reservations data
     * @param {Map} deviceSpecs - Device specifications
     * @param {Map} powerReadings - Power readings
     * @returns {Object} Power summary data
     */
    getPowerSummary(reservations, deviceSpecs, powerReadings) {
        let totalEnergyKwh = 0;
        let totalCost = 0;
        let totalCarbonFootprint = 0;
        let avgPowerDraw = 0;
        let peakPowerDraw = 0;
        let validReadings = 0;

        reservations.forEach(reservation => {
            const readingKey = `${reservation.device}_${reservation.id}`;
            const reading = powerReadings.get(readingKey);

            if (reading) {
                totalEnergyKwh += reading.totalEnergyKwh;
                totalCost += reading.totalEnergyKwh * CONFIG.POWER.COST_PER_KWH;
                totalCarbonFootprint += reading.totalEnergyKwh * CONFIG.POWER.CO2_PER_KWH;
                avgPowerDraw = (avgPowerDraw * validReadings + reading.avgPowerDraw) / (validReadings + 1);
                peakPowerDraw = Math.max(peakPowerDraw, reading.peakPowerDraw);
                validReadings++;
            }
        });

        return {
            totalEnergyKwh: Math.round(totalEnergyKwh * 100) / 100,
            totalCost: Math.round(totalCost * 100) / 100,
            totalCarbonFootprint: Math.round(totalCarbonFootprint * 100) / 100,
            avgPowerDraw: Math.round(avgPowerDraw * 100) / 100,
            peakPowerDraw: Math.round(peakPowerDraw * 100) / 100,
            validReadings,
            totalReservations: reservations.length,
            dataCompleteness: Math.round((validReadings / reservations.length) * 100)
        };
    }

    // Helper methods for mock data generation (replace with actual API calls)
    estimateMaxPowerDraw(device) {
        const powerMap = {
            'iPhone': 25, 'iPad': 45, 'MacBook': 87, 'iMac': 150,
            'Server': 500, 'Switch': 200, 'Router': 150, 'Laptop': 65
        };
        
        for (const [key, power] of Object.entries(powerMap)) {
            if (device.toLowerCase().includes(key.toLowerCase())) {
                return power + (Math.random() * 20 - 10); // ±10W variation
            }
        }
        return 100; // Default
    }

    estimateTypicalPowerDraw(device) {
        return this.estimateMaxPowerDraw(device) * (0.6 + Math.random() * 0.3); // 60-90% of max
    }

    getPowerType(device) {
        return device.toLowerCase().includes('server') ? 'AC' : 'DC';
    }

    getRackLocation(device) {
        return `Rack-${Math.floor(Math.random() * 10) + 1}`;
    }

    getPowerOutlet(device) {
        return `Outlet-${Math.floor(Math.random() * 24) + 1}`;
    }

    generateMockPowerReading(device) {
        return this.estimateTypicalPowerDraw(device) * (0.8 + Math.random() * 0.4);
    }

    generateMockPeakPowerReading(device) {
        return this.estimateMaxPowerDraw(device) * (0.9 + Math.random() * 0.1);
    }

    calculateTotalEnergy(reservation) {
        const avgPower = this.generateMockPowerReading(reservation.device);
        const hours = reservation.getDurationInDays() * 24;
        return (avgPower * hours) / 1000; // Convert Wh to kWh
    }

    generateMockHourlyReadings(reservation) {
        const readings = [];
        const hours = Math.min(reservation.getDurationInDays() * 24, 168); // Max 1 week of hourly data
        const basePower = this.generateMockPowerReading(reservation.device);
        
        for (let i = 0; i < hours; i++) {
            readings.push({
                timestamp: new Date(reservation.startDate.getTime() + i * 60 * 60 * 1000),
                powerDraw: basePower * (0.8 + Math.random() * 0.4),
                voltage: 120 + Math.random() * 10,
                current: (basePower / 120) * (0.9 + Math.random() * 0.2)
            });
        }
        
        return readings;
    }

    calculateUserPowerEfficiency(userStats) {
        // Simple efficiency score based on power usage patterns
        const avgPowerPerReservation = userStats.totalEnergyKwh / userStats.reservationCount;
        const costPerReservation = userStats.totalCost / userStats.reservationCount;
        
        // Lower power usage per reservation = higher efficiency score
        const maxExpectedPowerPerReservation = 50; // kWh
        const efficiencyScore = Math.max(0, 100 - (avgPowerPerReservation / maxExpectedPowerPerReservation) * 100);
        
        return Math.round(efficiencyScore);
    }

    projectMonthlyCost(totalCost, reservations) {
        const timeSpanDays = this.getTimeSpanDays(reservations);
        return timeSpanDays > 0 ? Math.round((totalCost / timeSpanDays) * 30 * 100) / 100 : 0;
    }

    projectYearlyCost(totalCost, reservations) {
        const timeSpanDays = this.getTimeSpanDays(reservations);
        return timeSpanDays > 0 ? Math.round((totalCost / timeSpanDays) * 365 * 100) / 100 : 0;
    }

    getTimeSpanDays(reservations) {
        if (reservations.length === 0) return 0;
        const dates = reservations.map(r => r.startDate).sort((a, b) => a - b);
        const spanMs = dates[dates.length - 1] - dates[0];
        return Math.max(1, spanMs / (1000 * 60 * 60 * 24));
    }

    getEmptyPowerStatistics() {
        return {
            devicePowerConsumption: [],
            regionPowerUsage: {},
            userPowerImpact: [],
            powerEfficiency: { overallEfficiency: 0 },
            costAnalysis: { totalCost: 0, totalEnergyKwh: 0 },
            powerTrends: { monthlyTrends: [], dailyTrends: [] },
            summary: { totalEnergyKwh: 0, totalCost: 0, validReadings: 0 }
        };
    }

    generateCacheKey(reservations) {
        const ids = reservations.map(r => r.id).sort().join(',');
        return `power_${ids.length}_${btoa(ids).slice(0, 10)}`;
    }

    clearCache() {
        this.cache.clear();
    }
}