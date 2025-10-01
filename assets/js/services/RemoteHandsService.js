// Remote Hands Service - Handles remote hands analytics and calculations
class RemoteHandsService {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Generate comprehensive remote hands analytics
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Object} Remote hands analytics object
     */
    generateRemoteHandsAnalytics(reservations) {
        const cacheKey = this.generateCacheKey(reservations);
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Filter reservations that require cabling changes
        const cablingChangeReservations = this.getCablingChangeReservations(reservations);

        const analytics = {
            capacityOverview: this.getCapacityOverview(cablingChangeReservations),
            deviceAnalysis: this.getDeviceAnalysis(cablingChangeReservations),
            userAnalysis: this.getUserAnalysis(cablingChangeReservations),
            summary: this.getSummary(cablingChangeReservations)
        };

        this.cache.set(cacheKey, analytics);
        return analytics;
    }

    /**
     * Filter reservations that require cabling changes
     * @param {Reservation[]} reservations - All reservations
     * @returns {Reservation[]} Reservations requiring cabling changes
     */
    getCablingChangeReservations(reservations) {
        return reservations.filter(reservation => {
            const cablingChange = reservation.rawData[CONFIG.CSV_COLUMNS.CABLING_CHANGE];
            return cablingChange && cablingChange.toLowerCase().trim() === 'yes';
        });
    }

    /**
     * Get capacity overview analytics
     * @param {Reservation[]} cablingReservations - Cabling change reservations
     * @returns {Object} Capacity overview data
     */
    getCapacityOverview(cablingReservations) {
        const regionStats = {};
        const monthlyCapacity = CONFIG.REMOTE_HANDS.HOURS_PER_MONTH_PER_REGION;

        // Calculate actual timeframe
        let timeframeDays = 30; // Default to 1 month
        if (cablingReservations.length > 0) {
            const dates = cablingReservations.map(r => r.startDate).sort((a, b) => a - b);
            const earliestDate = dates[0];
            const latestDate = dates[dates.length - 1];
            timeframeDays = Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24)) + 1;
        }

        const timeframeMonths = Math.max(1, timeframeDays / 30);
        const totalCapacityForTimeframe = monthlyCapacity * timeframeMonths;

        // Group by region
        cablingReservations.forEach(reservation => {
            const region = reservation.labRegion;
            
            if (!regionStats[region]) {
                regionStats[region] = {
                    hoursUsed: 0,
                    changesCount: 0,
                    reservations: []
                };
            }

            regionStats[region].hoursUsed += CONFIG.REMOTE_HANDS.CABLING_CHANGE_HOURS;
            regionStats[region].changesCount++;
            regionStats[region].reservations.push(reservation);
        });

        // Calculate utilization rates
        const regionalData = Object.entries(regionStats).map(([region, stats]) => ({
            region,
            hoursUsed: stats.hoursUsed,
            hoursAvailable: totalCapacityForTimeframe,
            changesCount: stats.changesCount,
            utilizationRate: Math.round((stats.hoursUsed / totalCapacityForTimeframe) * 100 * 10) / 10,
            cost: stats.hoursUsed * CONFIG.REMOTE_HANDS.COST_PER_HOUR,
            status: this.getCapacityStatus(stats.hoursUsed / totalCapacityForTimeframe)
        }));

        // Calculate totals
        const totalHoursUsed = regionalData.reduce((sum, region) => sum + region.hoursUsed, 0);
        const totalHoursAvailable = regionalData.reduce((sum, region) => sum + region.hoursAvailable, 0);
        const totalCost = regionalData.reduce((sum, region) => sum + region.cost, 0);

        return {
            regional: regionalData,
            totals: {
                hoursUsed: totalHoursUsed,
                hoursAvailable: totalHoursAvailable,
                utilizationRate: Math.round((totalHoursUsed / totalHoursAvailable) * 100 * 10) / 10,
                cost: totalCost,
                changesCount: cablingReservations.length
            },
            timeframe: {
                days: timeframeDays,
                months: timeframeMonths
            }
        };
    }

    /**
     * Get device analysis data
     * @param {Reservation[]} cablingReservations - Cabling change reservations
     * @returns {Object} Device analysis data
     */
    getDeviceAnalysis(cablingReservations) {
        const deviceStats = {};

        // Group by device
        cablingReservations.forEach(reservation => {
            const device = reservation.device;
            const region = reservation.labRegion;

            if (!deviceStats[device]) {
                deviceStats[device] = {
                    device,
                    regions: new Set(),
                    changesCount: 0,
                    hoursUsed: 0,
                    users: new Set()
                };
            }

            deviceStats[device].regions.add(region);
            deviceStats[device].changesCount++;
            deviceStats[device].hoursUsed += CONFIG.REMOTE_HANDS.CABLING_CHANGE_HOURS;
            deviceStats[device].users.add(reservation.requestedBy);
        });

        // Convert to array and calculate metrics
        const deviceAnalysis = Object.values(deviceStats).map(stats => ({
            device: stats.device,
            changesCount: stats.changesCount,
            hoursUsed: stats.hoursUsed,
            cost: stats.hoursUsed * CONFIG.REMOTE_HANDS.COST_PER_HOUR,
            regionsCount: stats.regions.size,
            usersCount: stats.users.size,
            avgHoursPerChange: Math.round((stats.hoursUsed / stats.changesCount) * 10) / 10
        }));

        return deviceAnalysis.sort((a, b) => b.hoursUsed - a.hoursUsed);
    }

    /**
     * Get user analysis data
     * @param {Reservation[]} cablingReservations - Cabling change reservations
     * @returns {Object} User analysis data
     */
    getUserAnalysis(cablingReservations) {
        const userStats = {};

        // Group by user
        cablingReservations.forEach(reservation => {
            const user = reservation.requestedBy;
            const region = reservation.labRegion;

            if (!userStats[user]) {
                userStats[user] = {
                    user,
                    regions: new Set(),
                    devices: new Set(),
                    changesCount: 0,
                    hoursUsed: 0
                };
            }

            userStats[user].regions.add(region);
            userStats[user].devices.add(reservation.device);
            userStats[user].changesCount++;
            userStats[user].hoursUsed += CONFIG.REMOTE_HANDS.CABLING_CHANGE_HOURS;
        });

        // Convert to array and calculate metrics
        const userAnalysis = Object.values(userStats).map(stats => ({
            user: stats.user,
            changesCount: stats.changesCount,
            hoursUsed: stats.hoursUsed,
            cost: stats.hoursUsed * CONFIG.REMOTE_HANDS.COST_PER_HOUR,
            regionsCount: stats.regions.size,
            devicesCount: stats.devices.size,
            avgHoursPerChange: Math.round((stats.hoursUsed / stats.changesCount) * 10) / 10,
            efficiencyScore: this.calculateUserEfficiencyScore(stats)
        }));

        return userAnalysis.sort((a, b) => b.hoursUsed - a.hoursUsed);
    }

    /**
     * Calculate user efficiency score
     * @param {Object} userStats - User statistics
     * @returns {number} Efficiency score (0-100)
     */
    calculateUserEfficiencyScore(userStats) {
        // Higher device diversity and lower hours per change = higher efficiency
        const diversityScore = Math.min(userStats.devices.size / 5, 1); // Max 5 devices for full score
        const efficiencyScore = Math.max(0, 1 - (userStats.hoursUsed / userStats.changesCount - 1) / 2);
        
        return Math.round((diversityScore * 0.3 + efficiencyScore * 0.7) * 100);
    }

    /**
     * Get summary statistics
     * @param {Reservation[]} cablingReservations - Cabling change reservations
     * @returns {Object} Summary data
     */
    getSummary(cablingReservations) {
        const totalChanges = cablingReservations.length;
        const totalHours = totalChanges * CONFIG.REMOTE_HANDS.CABLING_CHANGE_HOURS;
        const totalCost = totalHours * CONFIG.REMOTE_HANDS.COST_PER_HOUR;

        const uniqueDevices = new Set(cablingReservations.map(r => r.device)).size;
        const uniqueUsers = new Set(cablingReservations.map(r => r.requestedBy)).size;
        const uniqueRegions = new Set(cablingReservations.map(r => r.labRegion)).size;

        return {
            totalChanges,
            totalHours,
            totalCost,
            uniqueDevices,
            uniqueUsers,
            uniqueRegions,
            avgHoursPerChange: CONFIG.REMOTE_HANDS.CABLING_CHANGE_HOURS
        };
    }

    /**
     * Get capacity status based on utilization rate
     * @param {number} utilizationRate - Utilization rate (0-1)
     * @returns {string} Status (ok, warning, critical)
     */
    getCapacityStatus(utilizationRate) {
        if (utilizationRate >= CONFIG.REMOTE_HANDS.CRITICAL_THRESHOLD) {
            return 'critical';
        } else if (utilizationRate >= CONFIG.REMOTE_HANDS.WARNING_THRESHOLD) {
            return 'warning';
        }
        return 'ok';
    }

    /**
     * Generate cache key
     * @param {Reservation[]} reservations - Reservations data
     * @returns {string} Cache key
     */
    generateCacheKey(reservations) {
        const ids = reservations.map(r => r.id).sort().join(',');
        return `remotehands_${ids.length}_${btoa(ids).slice(0, 10)}`;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}