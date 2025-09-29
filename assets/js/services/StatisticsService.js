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
            summary: this.getStatisticsSummary(reservations),
            userActivityByRegion: this.getUserActivityByRegion(reservations),
            userDeviceDiversity: this.getUserDeviceDiversity(reservations),
            userBookingPatterns: this.getUserBookingPatterns(reservations),
            deviceTrends: this.getDeviceTrends(reservations)
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

        // Convert to array with basic metrics
        const usersArray = Object.entries(userStats)
            .map(([user, stats]) => ({
                user,
                reservationCount: stats.reservationCount,
                totalDays: stats.totalDays,
                uniqueDevices: stats.devices.size,
                avgDuration: Math.round(stats.totalDays / stats.reservationCount * 10) / 10
            }));

        // Calculate ranking scores
        const usersWithScores = this.calculateUserRankingScores(usersArray);

        return usersWithScores
            .sort((a, b) => b.rankingScore - a.rankingScore)
            .slice(0, CONFIG.STATS.TOP_ITEMS_LIMIT);
    }

    /**
     * Calculate unified ranking scores for users
     * @param {Array} users - Array of user statistics
     * @returns {Array} Users with ranking scores
     */
    calculateUserRankingScores(users) {
        if (users.length === 0) return users;

        // Find max values for normalization
        const maxReservations = Math.max(...users.map(u => u.reservationCount));
        const maxTotalDays = Math.max(...users.map(u => u.totalDays));
        const maxUniqueDevices = Math.max(...users.map(u => u.uniqueDevices));
        const maxAvgDuration = Math.max(...users.map(u => u.avgDuration));

        // Calculate scores with weighted components
        return users.map(user => {
            // Normalize each metric to 0-1 scale
            const reservationScore = user.reservationCount / maxReservations;
            const totalDaysScore = user.totalDays / maxTotalDays;
            const deviceDiversityScore = user.uniqueDevices / maxUniqueDevices;
            
            // For average duration, we want to reward reasonable durations
            // Very short durations (< 1 day) and very long durations (> 30 days) get lower scores
            const avgDurationScore = this.calculateDurationScore(user.avgDuration, maxAvgDuration);

            // Weighted combination of scores
            // Activity frequency (40%) + Total usage (30%) + Device diversity (20%) + Duration efficiency (10%)
            const rankingScore = Math.round((
                reservationScore * 0.4 +
                totalDaysScore * 0.3 +
                deviceDiversityScore * 0.2 +
                avgDurationScore * 0.1
            ) * 100);

            return {
                ...user,
                rankingScore
            };
        });
    }

    /**
     * Calculate duration efficiency score
     * @param {number} avgDuration - Average duration in days
     * @param {number} maxAvgDuration - Maximum average duration
     * @returns {number} Duration score (0-1)
     */
    calculateDurationScore(avgDuration, maxAvgDuration) {
        // Optimal duration range is 2-14 days
        const optimalMin = 2;
        const optimalMax = 14;

        if (avgDuration >= optimalMin && avgDuration <= optimalMax) {
            // Perfect score for optimal range
            return 1.0;
        } else if (avgDuration < optimalMin) {
            // Penalize very short durations (might indicate inefficient usage)
            return Math.max(0.3, avgDuration / optimalMin * 0.8);
        } else {
            // Penalize very long durations (might indicate hoarding)
            const penalty = Math.min(avgDuration / optimalMax, maxAvgDuration / optimalMax);
            return Math.max(0.2, 1.0 - (penalty - 1.0) * 0.5);
        }
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
     * Get user activity by region
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Object} User activity by region
     */
    getUserActivityByRegion(reservations) {
        const regionStats = {};

        reservations.forEach(reservation => {
            const region = reservation.labRegion;
            const user = reservation.requestedBy;

            if (!regionStats[region]) {
                regionStats[region] = {};
            }

            if (!regionStats[region][user]) {
                regionStats[region][user] = {
                    reservationCount: 0,
                    totalDays: 0,
                    devices: new Set()
                };
            }

            regionStats[region][user].reservationCount++;
            regionStats[region][user].totalDays += reservation.getDurationInDays();
            regionStats[region][user].devices.add(reservation.device);
        });

        // Convert to sorted arrays
        const result = {};
        Object.keys(regionStats).forEach(region => {
            result[region] = Object.entries(regionStats[region])
                .map(([user, stats]) => ({
                    user,
                    reservationCount: stats.reservationCount,
                    totalDays: stats.totalDays,
                    uniqueDevices: stats.devices.size,
                    avgDuration: Math.round(stats.totalDays / stats.reservationCount * 10) / 10
                }))
                .sort((a, b) => b.reservationCount - a.reservationCount)
                .slice(0, CONFIG.STATS.TOP_ITEMS_LIMIT);
        });

        return result;
    }

    /**
     * Get user device diversity statistics
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Array} User device diversity data
     */
    getUserDeviceDiversity(reservations) {
        const userStats = {};

        reservations.forEach(reservation => {
            const user = reservation.requestedBy;

            if (!userStats[user]) {
                userStats[user] = {
                    devices: new Set(),
                    reservationCount: 0,
                    regions: new Set()
                };
            }

            userStats[user].devices.add(reservation.device);
            userStats[user].reservationCount++;
            userStats[user].regions.add(reservation.labRegion);
        });

        return Object.entries(userStats)
            .map(([user, stats]) => ({
                user,
                uniqueDevices: stats.devices.size,
                uniqueRegions: stats.regions.size,
                reservationCount: stats.reservationCount,
                diversityScore: Math.round((stats.devices.size / stats.reservationCount) * 100)
            }))
            .sort((a, b) => b.diversityScore - a.diversityScore)
            .slice(0, CONFIG.STATS.TOP_ITEMS_LIMIT);
    }

    /**
     * Get user booking patterns
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Array} User booking patterns data
     */
    getUserBookingPatterns(reservations) {
        const userPatterns = {};

        reservations.forEach(reservation => {
            const user = reservation.requestedBy;
            const duration = reservation.getDurationInDays();

            if (!userPatterns[user]) {
                userPatterns[user] = {
                    shortTerm: 0, // 1-3 days
                    mediumTerm: 0, // 4-14 days
                    longTerm: 0, // 15+ days
                    totalReservations: 0,
                    totalDays: 0
                };
            }

            userPatterns[user].totalReservations++;
            userPatterns[user].totalDays += duration;

            if (duration <= 3) {
                userPatterns[user].shortTerm++;
            } else if (duration <= 14) {
                userPatterns[user].mediumTerm++;
            } else {
                userPatterns[user].longTerm++;
            }
        });

        return Object.entries(userPatterns)
            .map(([user, pattern]) => ({
                user,
                totalReservations: pattern.totalReservations,
                avgDuration: Math.round(pattern.totalDays / pattern.totalReservations * 10) / 10,
                shortTermPercent: Math.round((pattern.shortTerm / pattern.totalReservations) * 100),
                mediumTermPercent: Math.round((pattern.mediumTerm / pattern.totalReservations) * 100),
                longTermPercent: Math.round((pattern.longTerm / pattern.totalReservations) * 100),
                pattern: this.determineBookingPattern(pattern)
            }))
            .sort((a, b) => b.totalReservations - a.totalReservations)
            .slice(0, CONFIG.STATS.TOP_ITEMS_LIMIT);
    }

    /**
     * Determine booking pattern type
     * @param {Object} pattern - Pattern data
     * @returns {string} Pattern type
     */
    determineBookingPattern(pattern) {
        const total = pattern.totalReservations;
        const shortPercent = (pattern.shortTerm / total) * 100;
        const longPercent = (pattern.longTerm / total) * 100;

        if (shortPercent >= 70) return 'Quick User';
        if (longPercent >= 50) return 'Long-term User';
        return 'Balanced User';
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