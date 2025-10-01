// Statistics Service - Handles statistics generation and calculations
class StatisticsService {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Generate statistics from resolved reservations only
     * @param {Reservation[]} reservations - All reservations to analyze
     * @param {number} monthsBack - Number of months to look back (1, 3, 6, 12, or 0 for all time)
     * @returns {Object} Statistics object
     */
    generateStatistics(reservations, monthsBack = 0) {
        // Filter for resolved reservations only
        const resolvedReservations = reservations.filter(r => r.status === CONFIG.STATUS.RESOLVED);
        
        // Filter by timeframe if specified
        const filteredReservations = monthsBack > 0 ? 
            this.filterByTimeframe(resolvedReservations, monthsBack) : 
            resolvedReservations;

        const cacheKey = this.generateCacheKey(filteredReservations, monthsBack);
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const statistics = {
            deviceUtilization: this.getDeviceUtilization(filteredReservations),
            topDevicesByRegion: this.getTopDevicesByRegion(filteredReservations),
            topUsers: this.getTopUsers(filteredReservations),
            summary: this.getStatisticsSummary(filteredReservations, monthsBack)
        };

        this.cache.set(cacheKey, statistics);
        return statistics;
    }

    /**
     * Filter reservations by timeframe (public method)
     * @param {Reservation[]} reservations - Reservations to filter
     * @param {number} monthsBack - Number of months to look back
     * @returns {Reservation[]} Filtered reservations
     */
    filterByTimeframe(reservations, monthsBack) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
        
        return reservations.filter(reservation => 
            reservation.startDate >= cutoffDate
        );
    }

    /**
     * Get device utilization (days of use) for different timeframes
     * @param {Reservation[]} reservations - Resolved reservations to analyze
     * @returns {Object} Device utilization data for 1, 3, 6, 12 months
     */
    getDeviceUtilization(reservations) {
        const timeframes = [1, 3, 6, 12];
        const utilization = {};

        timeframes.forEach(months => {
            const filteredReservations = this.filterByTimeframe(reservations, months);
            utilization[`${months}months`] = this.calculateDeviceUtilizationForPeriod(filteredReservations);
        });

        return utilization;
    }

    /**
     * Calculate device utilization for a specific period
     * @param {Reservation[]} reservations - Reservations for the period
     * @returns {Object} Device utilization by region
     */
    calculateDeviceUtilizationForPeriod(reservations) {
        const deviceStats = {};

        // Group by region and device
        reservations.forEach(reservation => {
            const region = reservation.labRegion;
            const device = reservation.device;

            if (!deviceStats[region]) {
                deviceStats[region] = {};
            }

            if (!deviceStats[region][device]) {
                deviceStats[region][device] = [];
            }

            deviceStats[region][device].push(reservation);
        });

        // Calculate unique days used (handling overlaps)
        const result = {};
        Object.keys(deviceStats).forEach(region => {
            result[region] = {};
            Object.keys(deviceStats[region]).forEach(device => {
                const deviceReservations = deviceStats[region][device];
                const uniqueDays = this.calculateUniqueDaysUsed(deviceReservations);
                
                result[region][device] = {
                    daysUsed: uniqueDays,
                    reservationCount: deviceReservations.length
                };
            });
        });

        return result;
    }

    /**
     * Get top 10 devices by region (sorted by days used)
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
                deviceStats[region][device] = [];
            }

            deviceStats[region][device].push(reservation);
        });

        // Calculate stats and sort by days used
        const result = {};
        Object.keys(deviceStats).forEach(region => {
            const deviceArray = Object.entries(deviceStats[region])
                .map(([device, reservations]) => {
                    const uniqueDays = this.calculateUniqueDaysUsed(reservations);
                    return {
                        device,
                        daysUsed: uniqueDays,
                        reservationCount: reservations.length
                    };
                })
                .sort((a, b) => b.daysUsed - a.daysUsed)
                .slice(0, 10); // Top 10

            result[region] = deviceArray;
        });

        return result;
    }

    /**
     * Get top 10 active users
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {Array} Top users array with reservations, devices, and days
     */
    getTopUsers(reservations) {
        const userStats = {};

        // Group reservations by user
        reservations.forEach(reservation => {
            const user = reservation.requestedBy;

            if (!userStats[user]) {
                userStats[user] = {
                    reservations: [],
                    devices: new Set()
                };
            }

            userStats[user].reservations.push(reservation);
            userStats[user].devices.add(reservation.device);
        });

        // Calculate metrics for each user
        const usersArray = Object.entries(userStats)
            .map(([user, data]) => {
                const uniqueDays = this.calculateUniqueDaysUsed(data.reservations);
                return {
                    user,
                    numberOfReservations: data.reservations.length,
                    numberOfDevices: data.devices.size,
                    numberOfDays: uniqueDays
                };
            });

        // Sort by number of reservations (primary), then by days (secondary)
        return usersArray
            .sort((a, b) => {
                if (b.numberOfReservations !== a.numberOfReservations) {
                    return b.numberOfReservations - a.numberOfReservations;
                }
                return b.numberOfDays - a.numberOfDays;
            })
            .slice(0, 10); // Top 10
    }

    /**
     * Get overall statistics summary
     * @param {Reservation[]} reservations - Reservations to analyze
     * @param {number} monthsBack - Number of months analyzed
     * @returns {Object} Summary statistics
     */
    getStatisticsSummary(reservations, monthsBack) {
        const totalReservations = reservations.length;
        const totalDays = reservations.reduce((sum, r) => sum + r.getDurationInDays(), 0);

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
            uniqueDevices,
            uniqueUsers,
            uniqueRegions,
            dateRange,
            timeframe: monthsBack === 0 ? 'All time' : `Last ${monthsBack} month${monthsBack > 1 ? 's' : ''}`
        };
    }

    /**
     * Calculate unique days used by merging overlapping reservation periods
     * @param {Reservation[]} reservations - Reservations for a specific device or user
     * @returns {number} Number of unique days used
     */
    calculateUniqueDaysUsed(reservations) {
        if (reservations.length === 0) return 0;

        // Convert reservations to date ranges
        const dateRanges = reservations.map(r => ({
            start: new Date(r.startDate),
            end: new Date(r.endDate)
        })).sort((a, b) => a.start - b.start);

        // Merge overlapping ranges
        const mergedRanges = [];
        let currentRange = dateRanges[0];

        for (let i = 1; i < dateRanges.length; i++) {
            const nextRange = dateRanges[i];
            
            // If ranges overlap or are adjacent, merge them
            if (nextRange.start <= currentRange.end) {
                currentRange.end = new Date(Math.max(currentRange.end, nextRange.end));
            } else {
                // No overlap, save current range and start new one
                mergedRanges.push(currentRange);
                currentRange = nextRange;
            }
        }
        mergedRanges.push(currentRange);

        // Calculate total unique days
        let totalDays = 0;
        mergedRanges.forEach(range => {
            const days = Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24)) + 1;
            totalDays += days;
        });

        return totalDays;
    }

    /**
     * Generate cache key for statistics
     * @param {Reservation[]} reservations - Reservations data
     * @param {number} monthsBack - Months back parameter
     * @returns {string} Cache key
     */
    generateCacheKey(reservations, monthsBack) {
        const ids = reservations.map(r => r.id).sort().join(',');
        return `stats_${monthsBack}_${ids.length}_${btoa(ids).slice(0, 10)}`;
    }

    /**
     * Clear statistics cache
     */
    clearCache() {
        this.cache.clear();
    }
}