// Conflict Service - Handles conflict detection and resolution
class ConflictService {
    constructor() {
        this.conflicts = [];
    }

    /**
     * Find conflicts between reservations
     * @param {Reservation[]} newReservations - New reservations to check
     * @param {Reservation[]} acknowledgedReservations - Acknowledged reservations
     * @param {Reservation[]} resolvedReservations - Resolved reservations
     * @returns {ConflictGroup[]} Array of conflict groups
     */
    findConflicts(newReservations, acknowledgedReservations, resolvedReservations) {
        const conflicts = [];
        const processed = new Set();

        for (let i = 0; i < newReservations.length; i++) {
            if (processed.has(i)) continue;

            const currentRes = newReservations[i];
            const conflictGroup = [currentRes];

            // Check against other new reservations
            for (let j = i + 1; j < newReservations.length; j++) {
                if (processed.has(j)) continue;

                const compareRes = newReservations[j];
                if (currentRes.conflictsWith(compareRes)) {
                    conflictGroup.push(compareRes);
                    processed.add(j);
                }
            }

            // Check against acknowledged reservations
            acknowledgedReservations.forEach(ackRes => {
                if (currentRes.conflictsWith(ackRes)) {
                    conflictGroup.push(ackRes);
                }
            });

            // Check against resolved reservations
            resolvedReservations.forEach(resRes => {
                if (currentRes.conflictsWith(resRes)) {
                    conflictGroup.push(resRes);
                }
            });

            // Create conflict group if conflicts found
            if (conflictGroup.length > 1) {
                conflicts.push(new ConflictGroup(
                    currentRes.device,
                    currentRes.labRegion,
                    conflictGroup
                ));
                processed.add(i);
            }
        }

        this.conflicts = conflicts;
        return conflicts;
    }

    /**
     * Resolve conflicts using stability mode
     * @param {ConflictGroup[]} conflicts - Array of conflict groups
     * @returns {ConflictGroup[]} Conflicts with resolutions applied
     */
    resolveConflictsStabilityMode(conflicts) {
        conflicts.forEach(group => {
            // Sort by ID (lower ID = higher priority)
            group.reservations.sort((a, b) => parseInt(a.id) - parseInt(b.id));

            // Apply suggestions to all but the first (lowest ID)
            for (let i = 1; i < group.reservations.length; i++) {
                const prevReservation = group.reservations[i - 1];
                const currentReservation = group.reservations[i];

                const suggestion = this.generateRescheduleSuggestion(
                    prevReservation, 
                    currentReservation
                );
                
                currentReservation.setSuggestion(suggestion);
            }
        });

        return conflicts;
    }

    /**
     * Generate reschedule suggestion for a reservation
     * @param {Reservation} prevReservation - Previous reservation that takes priority
     * @param {Reservation} currentReservation - Current reservation to reschedule
     * @returns {string} Suggestion text
     */
    generateRescheduleSuggestion(prevReservation, currentReservation) {
        // Calculate new start date (day after previous ends + buffer)
        const newStartDate = new Date(prevReservation.endDate);
        newStartDate.setDate(newStartDate.getDate() + CONFIG.CONFLICT.BUFFER_DAYS);

        // Calculate new end date (maintain same duration)
        const originalDuration = currentReservation.getDurationInDays();
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + originalDuration - 1);

        return `Reschedule: ${Utils.formatDate(newStartDate)} → ${Utils.formatDate(newEndDate)} (Duration: ${currentReservation.getDuration()})`;
    }

    /**
     * Get valid reservations (no conflicts)
     * @param {Reservation[]} newReservations - New reservations
     * @param {ConflictGroup[]} conflicts - Conflict groups
     * @returns {Reservation[]} Valid reservations
     */
    getValidReservations(newReservations, conflicts) {
        const conflictedIds = new Set();
        
        conflicts.forEach(conflict => {
            conflict.reservations.forEach(reservation => {
                conflictedIds.add(reservation.id);
            });
        });

        return newReservations.filter(reservation => 
            !conflictedIds.has(reservation.id)
        );
    }

    /**
     * Get conflict summary
     * @param {ConflictGroup[]} conflicts - Conflict groups
     * @returns {Object} Conflict summary
     */
    getConflictSummary(conflicts) {
        const totalConflicted = conflicts.reduce((sum, group) => 
            sum + group.reservations.length, 0
        );

        return {
            conflictGroups: conflicts.length,
            totalConflicted: totalConflicted,
            conflicts: conflicts
        };
    }

    /**
     * Reset conflict service
     */
    reset() {
        this.conflicts = [];
    }
}

/**
 * Conflict Group class to represent a group of conflicting reservations
 */
class ConflictGroup {
    constructor(device, labRegion, reservations) {
        this.device = device;
        this.labRegion = labRegion;
        this.reservations = reservations;
        this.id = Utils.generateId();
    }

    /**
     * Get the number of reservations in this conflict
     * @returns {number} Number of conflicting reservations
     */
    getConflictCount() {
        return this.reservations.length;
    }

    /**
     * Get reservations with suggestions
     * @returns {Reservation[]} Reservations that have suggestions
     */
    getReservationsWithSuggestions() {
        return this.reservations.filter(reservation => 
            reservation.hasSuggestion()
        );
    }

    /**
     * Get the primary reservation (lowest ID, no suggestion)
     * @returns {Reservation} Primary reservation
     */
    getPrimaryReservation() {
        return this.reservations.find(reservation => 
            !reservation.hasSuggestion()
        );
    }

    /**
     * Convert to plain object for serialization
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            id: this.id,
            device: this.device,
            labRegion: this.labRegion,
            conflictCount: this.getConflictCount(),
            reservations: this.reservations.map(r => r.toObject())
        };
    }
}