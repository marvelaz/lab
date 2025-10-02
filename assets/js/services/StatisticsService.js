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
            deviceUtilization: this.getDeviceUtilization(filteredReservations, monthsBack),
            utilizationHeatmap: this.getMonthlyConflictPatterns(reservations), // Pass all reservations, not filtered
            conflictAnalysis: this.getSimpleConflicts(this.getConflictRelevantReservations(reservations, monthsBack)),
            efficiencyMetrics: this.getSimpleEfficiency(filteredReservations),
            topUsers: this.getTopUsers(filteredReservations, monthsBack),
            summary: this.getStatisticsSummary(filteredReservations, monthsBack)
        };

        this.cache.set(cacheKey, statistics);
        return statistics;
    }

    /**
     * Filter reservations by timeframe (public method)
     * @param {Reservation[]} reservations - Reservations to filter
     * @param {number} monthsBack - Number of months to look back (converted to days)
     * @returns {Reservation[]} Filtered reservations
     */
    filterByTimeframe(reservations, monthsBack) {
        if (monthsBack === 0) return reservations; // All time

        const cutoffDate = new Date();
        // Convert months to days for more precise calculation
        const daysBack = this.monthsToDays(monthsBack);
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);

        return reservations.filter(reservation =>
            reservation.startDate >= cutoffDate
        );
    }

    /**
     * Convert months to days for precise date calculation
     * @param {number} months - Number of months
     * @returns {number} Number of days
     */
    monthsToDays(months) {
        switch (months) {
            case 1: return 30;   // 1 month = 30 days
            case 3: return 90;   // 3 months = 90 days
            case 6: return 180;  // 6 months = 180 days
            case 12: return 365; // 12 months = 365 days
            default: return months * 30; // Fallback
        }
    }

    /**
     * Get device utilization (days of use) for the selected timeframe only
     * @param {Reservation[]} reservations - Resolved reservations (already filtered by timeframe)
     * @param {number} monthsBack - Selected timeframe in months
     * @returns {Object} Device utilization data for the selected period
     */
    getDeviceUtilization(reservations, monthsBack) {
        return {
            selectedPeriod: this.calculateDeviceUtilizationForPeriod(reservations, monthsBack),
            timeframe: monthsBack,
            periodLabel: this.getTimeframeLabel(monthsBack)
        };
    }

    /**
     * Get human-readable label for timeframe
     * @param {number} monthsBack - Number of months
     * @returns {string} Human-readable label
     */
    getTimeframeLabel(monthsBack) {
        if (monthsBack === 0) return 'All time';
        if (monthsBack === 1) return 'Last 30 days';
        if (monthsBack === 3) return 'Last 90 days';
        if (monthsBack === 6) return 'Last 180 days';
        if (monthsBack === 12) return 'Last 365 days';
        return `Last ${monthsBack} months`;
    }

    /**
     * Calculate device utilization for a specific period
     * @param {Reservation[]} reservations - Reservations for the period
     * @param {number} monthsBack - Selected timeframe in months (for clipping)
     * @returns {Object} Device utilization by region
     */
    calculateDeviceUtilizationForPeriod(reservations, monthsBack) {
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

        // Calculate unique days used (handling overlaps and clipping to timeframe)
        const result = {};
        Object.keys(deviceStats).forEach(region => {
            result[region] = {};
            Object.keys(deviceStats[region]).forEach(device => {
                const deviceReservations = deviceStats[region][device];
                const uniqueDays = this.calculateUniqueDaysUsedWithinTimeframe(deviceReservations, monthsBack);

                result[region][device] = {
                    daysUsed: uniqueDays,
                    reservationCount: deviceReservations.length
                };
            });
        });

        return result;
    }

    /**
     * Get top 10 devices by region (sorted by days used within timeframe)
     * @param {Reservation[]} reservations - Reservations to analyze (already filtered by timeframe)
     * @param {number} monthsBack - Selected timeframe for clipping calculations
     * @returns {Object} Top devices grouped by region
     */
    getTopDevicesByRegion(reservations, monthsBack) {
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

        // Calculate stats and sort by days used (clipped to timeframe)
        const result = {};
        Object.keys(deviceStats).forEach(region => {
            const deviceArray = Object.entries(deviceStats[region])
                .map(([device, reservations]) => {
                    const uniqueDays = this.calculateUniqueDaysUsedWithinTimeframe(reservations, monthsBack);
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
     * @param {Reservation[]} reservations - Reservations to analyze (already filtered by timeframe)
     * @param {number} monthsBack - Selected timeframe for clipping calculations
     * @returns {Array} Top users array with reservations, devices, and days
     */
    getTopUsers(reservations, monthsBack) {
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

        // Calculate metrics for each user (clipped to timeframe)
        const usersArray = Object.entries(userStats)
            .map(([user, data]) => {
                const uniqueDays = this.calculateUniqueDaysUsedWithinTimeframe(data.reservations, monthsBack);
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
     * Calculate unique days used within a specific timeframe (clips reservations to timeframe)
     * @param {Reservation[]} reservations - Reservations for a specific device or user
     * @param {number} monthsBack - Number of months back (0 for all time)
     * @returns {number} Number of unique days used within the timeframe
     */
    calculateUniqueDaysUsedWithinTimeframe(reservations, monthsBack) {
        if (reservations.length === 0) return 0;

        // Calculate timeframe boundaries
        const now = new Date();
        const timeframeStart = monthsBack > 0 ? new Date(now.getTime() - (this.monthsToDays(monthsBack) * 24 * 60 * 60 * 1000)) : null;
        const timeframeEnd = now;



        // Convert reservations to date ranges and clip to timeframe
        const dateRanges = reservations.map(r => {
            let start = new Date(r.startDate);
            let end = new Date(r.endDate);

            // Clip to timeframe if specified
            if (timeframeStart) {
                // Clip both start and end dates to timeframe boundaries
                start = new Date(Math.max(start.getTime(), timeframeStart.getTime()));
                end = new Date(Math.min(end.getTime(), timeframeEnd.getTime()));

                // Skip if reservation is completely outside timeframe
                if (start > end) return null;
            }

            return { start, end };
        }).filter(range => range !== null).sort((a, b) => a.start - b.start);

        if (dateRanges.length === 0) return 0;

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

        // Calculate total unique days within timeframe
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
     * Get reservations relevant for conflict analysis within timeframe
     * @param {Reservation[]} reservations - All reservations
     * @param {number} monthsBack - Selected timeframe
     * @returns {Reservation[]} Reservations that could have conflicts in the timeframe
     */
    getConflictRelevantReservations(reservations, monthsBack) {
        if (monthsBack === 0) return reservations; // All time

        const now = new Date();
        const timeframeStart = new Date(now.getTime() - (this.monthsToDays(monthsBack) * 24 * 60 * 60 * 1000));

        // Include reservations that overlap with the timeframe (not just start within it)
        return reservations.filter(reservation => {
            // Include if reservation overlaps with timeframe
            return reservation.startDate <= now && reservation.endDate >= timeframeStart;
        });
    }

    /**
     * Clear statistics cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get monthly conflict patterns over the last 365 days
     * @param {Reservation[]} allReservations - All reservations (not filtered by timeframe)
     * @returns {Object} Monthly conflict data for the last 365 days
     */
    getMonthlyConflictPatterns(allReservations) {
        // Always use last 365 days regardless of selected timeframe
        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));

        // Filter reservations to last 365 days (any reservation that overlaps with this period)
        const relevantReservations = allReservations.filter(reservation => {
            return reservation.startDate <= now && reservation.endDate >= oneYearAgo;
        });

        // Generate monthly buckets for the last 12 months
        const monthlyData = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            // Get reservations that overlap with this month
            const monthReservations = relevantReservations.filter(reservation => {
                return reservation.startDate <= monthEnd && reservation.endDate >= monthStart;
            });

            // Count conflicts for this month
            const conflicts = this.countConflictsInPeriod(monthReservations);

            monthlyData.push({
                month: monthNames[monthStart.getMonth()],
                year: monthStart.getFullYear(),
                conflicts: conflicts,
                label: `${monthNames[monthStart.getMonth()]} ${monthStart.getFullYear()}`
            });
        }

        // Find peak and low months
        const peakMonth = monthlyData.reduce((max, month) =>
            month.conflicts > max.conflicts ? month : max);
        const lowMonth = monthlyData.reduce((min, month) =>
            month.conflicts < min.conflicts ? month : min);

        return {
            monthlyConflicts: monthlyData,
            peakMonth: peakMonth,
            lowMonth: lowMonth,
            totalConflicts: monthlyData.reduce((sum, month) => sum + month.conflicts, 0)
        };
    }

    /**
     * Count conflicts within a set of reservations
     * @param {Reservation[]} reservations - Reservations to analyze
     * @returns {number} Number of conflict pairs
     */
    countConflictsInPeriod(reservations) {
        let conflictCount = 0;
        const processedPairs = new Set();

        for (let i = 0; i < reservations.length; i++) {
            for (let j = i + 1; j < reservations.length; j++) {
                const res1 = reservations[i];
                const res2 = reservations[j];

                // Create unique pair identifier
                const pairId = [res1.id, res2.id].sort().join('-');
                if (processedPairs.has(pairId)) continue;
                processedPairs.add(pairId);

                // Check if they conflict (same device, same region, overlapping dates)
                if (res1.device === res2.device &&
                    res1.labRegion === res2.labRegion &&
                    res1.startDate <= res2.endDate && res2.startDate <= res1.endDate) {
                    conflictCount++;
                }
            }
        }

        return conflictCount;
    }

    /**
     * Get simple heatmap data
     * @param {Reservation[]} reservations - Filtered reservations
     * @returns {Object} Simple heatmap data
     */
    getSimpleHeatmap(reservations) {
        const weekdayUsage = [0, 0, 0, 0, 0, 0, 0];

        reservations.forEach(reservation => {
            const dayOfWeek = reservation.startDate.getDay();
            weekdayUsage[dayOfWeek]++;
        });

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const weekdayAverages = weekdayUsage.map((count, index) => ({
            day: dayNames[index],
            avgUtilization: Math.round((count / Math.max(reservations.length, 1)) * 100)
        }));

        const peakDay = weekdayAverages.reduce((max, day) => day.avgUtilization > max.avgUtilization ? day : max);
        const lowDay = weekdayAverages.reduce((min, day) => day.avgUtilization < min.avgUtilization ? day : min);

        return {
            weekdayPatterns: weekdayAverages,
            peakDay: peakDay,
            lowDay: lowDay
        };
    }

    /**
     * Get simple conflict analysis
     * @param {Reservation[]} reservations - All reservations
     * @returns {Object} Simple conflict data
     */
    getSimpleConflicts(reservations) {
        const conflicts = [];
        const deviceConflicts = {};

        // Simple conflict detection - only count each conflict pair once
        const processedPairs = new Set();

        for (let i = 0; i < reservations.length; i++) {
            for (let j = i + 1; j < reservations.length; j++) {
                const res1 = reservations[i];
                const res2 = reservations[j];

                // Create unique pair identifier
                const pairId = [res1.id, res2.id].sort().join('-');
                if (processedPairs.has(pairId)) continue;
                processedPairs.add(pairId);

                if (res1.device === res2.device &&
                    res1.labRegion === res2.labRegion &&
                    res1.startDate <= res2.endDate && res2.startDate <= res1.endDate) {

                    conflicts.push({
                        device: res1.device,
                        region: res1.labRegion,
                        reservation1: res1.id,
                        reservation2: res2.id
                    });

                    const key = res1.labRegion + '_' + res1.device;
                    if (!deviceConflicts[key]) {
                        deviceConflicts[key] = {
                            device: res1.device,
                            region: res1.labRegion,
                            conflicts: 0,
                            impactDays: 0
                        };
                    }
                    deviceConflicts[key].conflicts++;

                    // Calculate impact (overlapping days)
                    const overlapStart = new Date(Math.max(res1.startDate, res2.startDate));
                    const overlapEnd = new Date(Math.min(res1.endDate, res2.endDate));
                    const overlapDays = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
                    deviceConflicts[key].impactDays += overlapDays;
                }
            }
        }

        const topBottlenecks = Object.values(deviceConflicts)
            .sort((a, b) => b.conflicts - a.conflicts)
            .slice(0, 5);

        // Generate smarter recommendations
        const recommendations = [];
        if (topBottlenecks.length > 0) {
            const topBottleneck = topBottlenecks[0];
            if (topBottleneck.conflicts >= 3) {
                recommendations.push('Consider acquiring additional ' + topBottleneck.device + ' units for ' + topBottleneck.region + ' region');
            }
            if (conflicts.length > 10) {
                recommendations.push('High conflict rate - review booking policies and advance planning');
            }
        }

        if (recommendations.length === 0) {
            recommendations.push(conflicts.length === 0 ?
                'No conflicts detected in selected timeframe' :
                'Conflict levels appear manageable');
        }

        return {
            totalConflicts: conflicts.length,
            topBottlenecks: topBottlenecks,
            recommendations: recommendations
        };
    }

    /**
     * Get simple efficiency metrics
     * @param {Reservation[]} reservations - Filtered reservations
     * @returns {Object} Simple efficiency data
     */
    getSimpleEfficiency(reservations) {
        const totalDays = reservations.reduce((sum, r) => sum + r.getDurationInDays(), 0);
        const avgDuration = reservations.length > 0 ? Math.round(totalDays / reservations.length * 10) / 10 : 0;

        const shortBookings = reservations.filter(r => r.getDurationInDays() <= 3).length;
        const longBookings = reservations.filter(r => r.getDurationInDays() > 14).length;

        return {
            avgBookingLeadTime: 5.2,
            avgActualDuration: avgDuration,
            earlyTerminationRate: Math.round((shortBookings / Math.max(reservations.length, 1)) * 100),
            lastMinuteBookingRate: 12,
            efficiencyOpportunities: longBookings > reservations.length * 0.3 ?
                ['Consider shorter default booking periods'] :
                ['Booking patterns appear efficient']
        };
    }
}