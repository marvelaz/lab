// Statistics Service - Handles statistics generation and calculations
class StatisticsService {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Generate comprehensive statistics from reservations data
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Object} Statistics object
     */
    generateStatistics(reservations) {
        const cacheKey = this.generateCacheKey(reservations);
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const statistics = {
            topDevices: this.getTopDevicesByRegion(reservations),
            topUsers: this.getTopUsers(reservations),
            utilizationRates: this.getUtilizationRates(reservations),
            leastReservedDevices: this.getLeastReservedDevices(reservations),
            summary: this.getStatisticsSummary(reservations)
        };

        this.cache.set(cacheKey, statistics);
        return statistics;
    }

    /**
     * Get top devices by region
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Object} Top devices grouped by region
     */
    getTopDevicesByRegion(reservations) {
        const deviceStats = {};

        // Group by region and device
        reservations.forEach(reservation => {
            const region = reservation.labRegion;
            const device = reservation.device;

            if (!deviceStats[region]) {
                deviceStats[region] = {};
            }

            if (!deviceStats[region][device]) {
                deviceStats[region][device] = {
                    count: 0,
                    totalDays: 0,
                    users: new Set()
                };
            }

            deviceStats[region][device].count++;
            deviceStats[region][device].totalDays += reservation.getDurationInDays();
            deviceStats[region][device].users.add(reservation.requestedBy);
        });

        // Convert to sorted arrays
        const result = {};
        Object.keys(deviceStats).forEach(region => {
            result[region] = Object.entries(deviceStats[region])
                .map(([device, stats]) => ({
                    device,
                    count: stats.count,
                    totalDays: stats.totalDays,
                    uniqueUsers: stats.users.size,
                    avgDuration: Math.round(stats.totalDays / stats.count * 10) / 10
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, CONFIG.STATS.TOP_ITEMS_LIMIT);
        });

        return result;
    }

    /**
     * Get top users by activity
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Array} Top users array
     */
    getTopUsers(reservations) {
        const userStats = {};

        reservations.forEach(reservation => {
            const user = reservation.requestedBy;

            if (!userStats[user]) {
                userStats[user] = {
                    reservationCount: 0,
                    totalDays: 0,
                    devices: new Set()
                };
            }

            userStats[user].reservationCount++;
            userStats[user].totalDays += reservation.getDurationInDays();
            userStats[user].devices.add(reservation.device);
        });

        return Object.entries(userStats)
            .map(([user, stats]) => ({
                user,
                reservationCount: stats.reservationCount,
                totalDays: stats.totalDays,
                uniqueDevices: stats.devices.size,
                avgDuration: Math.round(stats.totalDays / stats.reservationCount * 10) / 10
            }))
            .sort((a, b) => b.reservationCount - a.reservationCount)
            .slice(0, CONFIG.STATS.TOP_ITEMS_LIMIT);
    }

    /**
     * Calculate utilization rates by region
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Object} Utilization rates by region
     */
    getUtilizationRates(reservations) {
        const regionStats = {};
        const totalDays = CONFIG.STATS.UTILIZATION_DAYS;

        // Group by region and device
        reservations.forEach(reservation => {
            const region = reservation.labRegion;
            const device = reservation.device;

            if (!regionStats[region]) {
                regionStats[region] = {};
            }

            if (!regionStats[region][device]) {
                regionStats[region][device] = {
                    reservedDays: 0,
                    reservationCount: 0
                };
            }

            regionStats[region][device].reservedDays += reservation.getDurationInDays();
            regionStats[region][device].reservationCount++;
        });

        // Calculate utilization percentages
        const result = {};
        Object.keys(regionStats).forEach(region => {
            result[region] = Object.entries(regionStats[region])
                .map(([device, stats]) => ({
                    device,
                    reservedDays: stats.reservedDays,
                    reservationCount: stats.reservationCount,
                    utilizationRate: Math.round((stats.reservedDays / totalDays) * 100 * 10) / 10
                }))
                .sort((a, b) => b.utilizationRate - a.utilizationRate);
        });

        return result;
    }

    /**
     * Get least reserved devices by region
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Object} Least reserved devices by region
     */
    getLeastReservedDevices(reservations) {
        const deviceStats = this.getTopDevicesByRegion(reservations);
        
        const result = {};
        Object.keys(deviceStats).forEach(region => {
            result[region] = deviceStats[region]
                .sort((a, b) => a.count - b.count)
                .slice(0, CONFIG.STATS.TOP_ITEMS_LIMIT);
        });

        return result;
    }

    /**
     * Get overall statistics summary
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Object} Summary statistics
     */
    getStatisticsSummary(reservations) {
        const totalReservations = reservations.length;
        const totalDays = reservations.reduce((sum, r) => sum + r.getDurationInDays(), 0);
        const avgDuration = totalReservations > 0 ? totalDays / totalReservations : 0;

        const uniqueDevices = new Set(reservations.map(r => r.device)).size;
        const uniqueUsers = new Set(reservations.map(r => r.requestedBy)).size;
        const uniqueRegions = new Set(reservations.map(r => r.labRegion)).size;

        // Date range
        const dates = reservations.map(r => r.startDate).sort((a, b) => a - b);
        const dateRange = dates.length > 0 ? {
            earliest: Utils.formatDate(dates[0]),
            latest: Utils.formatDate(dates[dates.length - 1])
        } : null;

        return {
            totalReservations,
            totalDays,
            avgDuration: Math.round(avgDuration * 10) / 10,
            uniqueDevices,
            uniqueUsers,
            uniqueRegions,
            dateRange
        };
    }

    /**
     * Get device popularity trends
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Object} Device trends data
     */
    getDeviceTrends(reservations) {
        const monthlyStats = {};

        reservations.forEach(reservation => {
            const monthKey = reservation.startDate.toISOString().slice(0, 7); // YYYY-MM
            const device = reservation.device;

            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = {};
            }

            if (!monthlyStats[monthKey][device]) {
                monthlyStats[monthKey][device] = 0;
            }

            monthlyStats[monthKey][device]++;
        });

        return monthlyStats;
    }

    /**
     * Get regional comparison data
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Object} Regional comparison data
     */
    getRegionalComparison(reservations) {
        const regionStats = {};

        reservations.forEach(reservation => {
            const region = reservation.labRegion;

            if (!regionStats[region]) {
                regionStats[region] = {
                    totalReservations: 0,
                    totalDays: 0,
                    uniqueDevices: new Set(),
                    uniqueUsers: new Set()
                };
            }

            regionStats[region].totalReservations++;
            regionStats[region].totalDays += reservation.getDurationInDays();
            regionStats[region].uniqueDevices.add(reservation.device);
            regionStats[region].uniqueUsers.add(reservation.requestedBy);
        });

        // Convert sets to counts
        Object.keys(regionStats).forEach(region => {
            regionStats[region].uniqueDevices = regionStats[region].uniqueDevices.size;
            regionStats[region].uniqueUsers = regionStats[region].uniqueUsers.size;
            regionStats[region].avgDuration = regionStats[region].totalReservations > 0 ?
                Math.round(regionStats[region].totalDays / regionStats[region].totalReservations * 10) / 10 : 0;
        });

        return regionStats;
    }

    /**
     * Generate cache key for statistics
     * @param {Reservation[]} reservations - Reservations data
     * @returns {string} Cache key
     */
    generateCacheKey(reservations) {
        const ids = reservations.map(r => r.id).sort().join(',');
        return `stats_${ids.length}_${btoa(ids).slice(0, 10)}`;
    }

    /**
     * Clear statistics cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache information
     */
    getCacheInfo() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}