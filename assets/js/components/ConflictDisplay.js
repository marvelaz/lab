// Conflict Display Component - Handles conflict visualization and valid reservations display
class ConflictDisplay {
    constructor() {
        this.summaryCards = null;
        this.conflictsSection = null;
        this.validReservations = null;
    }

    /**
     * Initialize conflict display component
     */
    init() {
        this.summaryCards = document.getElementById('summaryCards');
        this.conflictsSection = document.getElementById('conflictsSection');
        this.validReservations = document.getElementById('validReservations');
        
        console.log('ConflictDisplay component initialized');
    }

    /**
     * Display summary cards
     * @param {Object} summaryData - Summary data object
     */
    displaySummaryCards(summaryData) {
        if (!this.summaryCards) return;

        const { totalNew, totalConflicted, totalValid, conflictGroups } = summaryData;

        this.summaryCards.innerHTML = `
            <div class="card">
                <div class="card-number">${totalNew}</div>
                <div class="card-label">Total New Reservations</div>
            </div>
            <div class="card conflict-card">
                <div class="card-number">${totalConflicted}</div>
                <div class="card-label">Conflicted Reservations</div>
            </div>
            <div class="card valid-card">
                <div class="card-number">${totalValid}</div>
                <div class="card-label">Valid Reservations</div>
            </div>
            <div class="card">
                <div class="card-number">${conflictGroups}</div>
                <div class="card-label">Conflict Groups</div>
            </div>
        `;
    }

    /**
     * Display conflicts
     * @param {ConflictGroup[]} conflicts - Array of conflict groups
     */
    displayConflicts(conflicts) {
        if (!this.conflictsSection) return;

        if (conflicts.length === 0) {
            this.conflictsSection.innerHTML = `
                <div class="conflicts-section">
                    <h3>🎉 No Conflicts Detected</h3>
                    <p>All new reservations are valid and don't conflict with existing bookings.</p>
                </div>
            `;
            return;
        }

        let conflictsHTML = `
            <div class="conflicts-section">
                <h3>⚠️ Conflicts Detected (${conflicts.length} groups)</h3>
                <p>The following reservations have scheduling conflicts. Lower ID numbers take precedence.</p>
        `;

        conflicts.forEach((conflict, index) => {
            conflictsHTML += this.renderConflictGroup(conflict, index + 1);
        });

        conflictsHTML += '</div>';
        this.conflictsSection.innerHTML = conflictsHTML;
    }

    /**
     * Render a single conflict group
     * @param {ConflictGroup} conflict - Conflict group to render
     * @param {number} groupNumber - Group number for display
     * @returns {string} HTML string for conflict group
     */
    renderConflictGroup(conflict, groupNumber) {
        const primaryReservation = conflict.getPrimaryReservation();
        const conflictingReservations = conflict.getReservationsWithSuggestions();
        const allReservations = [primaryReservation, ...conflictingReservations];

        let html = `
            <div class="conflict-group">
                <div class="conflict-header">
                    Conflict Group ${groupNumber}: ${conflict.device} in ${conflict.labRegion}
                    <span style="font-weight: normal; color: #666; font-size: 0.9em;">
                        (${conflict.getConflictCount()} reservations)
                    </span>
                </div>
                
                <!-- Timeline Visualization -->
                <div class="conflict-timeline">
                    <h4 style="margin: 0 0 12px 0; color: #333; font-size: 0.95em;">📊 Timeline Visualization</h4>
                    ${this.renderConflictTimeline(allReservations)}
                </div>
        `;

        // Display primary reservation (honored)
        if (primaryReservation) {
            html += `
                <div class="reservation-item" style="border-left: 4px solid #28a745;">
                    <div style="margin-bottom: 8px;">
                        <strong>✅ HONORED RESERVATION (Lowest ID)</strong>
                    </div>
                    ${this.renderReservationDetails(primaryReservation)}
                </div>
            `;
        }

        // Display conflicting reservations
        conflictingReservations.forEach(reservation => {
            html += `
                <div class="reservation-item" style="border-left: 4px solid #dc3545;">
                    <div style="margin-bottom: 8px;">
                        <strong>⚠️ CONFLICTING RESERVATION</strong>
                    </div>
                    ${this.renderReservationDetails(reservation)}
                    <div style="margin-top: 12px; padding: 8px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                        <strong>💡 Suggested Resolution:</strong> ${reservation.suggestion}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * Render conflict timeline visualization
     * @param {Reservation[]} reservations - Array of conflicting reservations
     * @returns {string} HTML string for timeline
     */
    renderConflictTimeline(reservations) {
        if (!reservations || reservations.length === 0) return '';

        // Find the overall date range
        const allDates = reservations.flatMap(r => [r.startDate, r.endDate]);
        const minDate = new Date(Math.min(...allDates));
        const maxDate = new Date(Math.max(...allDates));
        
        // Calculate total span in days
        const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
        
        let html = `
            <div class="timeline-container">
                <div class="timeline-header">
                    <div class="timeline-dates">
                        <span class="timeline-start">${this.formatTimelineDate(minDate)}</span>
                        <span class="timeline-end">${this.formatTimelineDate(maxDate)}</span>
                    </div>
                    <div class="timeline-duration">${totalDays} day${totalDays > 1 ? 's' : ''} span</div>
                </div>
                <div class="timeline-tracks">
        `;

        // Sort reservations by ID for consistent display
        const sortedReservations = [...reservations].sort((a, b) => parseInt(a.id) - parseInt(b.id));

        sortedReservations.forEach((reservation, index) => {
            const isHonored = index === 0; // First (lowest ID) is honored
            const startOffset = Math.max(0, (reservation.startDate - minDate) / (1000 * 60 * 60 * 24));
            const duration = (reservation.endDate - reservation.startDate) / (1000 * 60 * 60 * 24) + 1;
            const widthPercent = (duration / totalDays) * 100;
            const leftPercent = (startOffset / totalDays) * 100;

            html += `
                <div class="timeline-track">
                    <div class="timeline-label">
                        <span class="reservation-id">ID ${reservation.id}</span>
                        <span class="reservation-user">${reservation.requestedBy}</span>
                        ${isHonored ? '<span class="honored-badge">✅</span>' : '<span class="conflict-badge">⚠️</span>'}
                    </div>
                    <div class="timeline-bar-container">
                        <div class="timeline-bar ${isHonored ? 'honored' : 'conflicting'}" 
                             style="left: ${leftPercent}%; width: ${widthPercent}%;"
                             title="ID ${reservation.id}: ${reservation.getFormattedStartDate()} to ${reservation.getFormattedEndDate()} (${reservation.getDuration()})">
                            <span class="timeline-bar-text">${duration} day${duration > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div class="timeline-legend">
                    <div class="legend-item">
                        <div class="legend-color honored"></div>
                        <span>Honored Reservation</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color conflicting"></div>
                        <span>Conflicting Reservation</span>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Format date for timeline display
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatTimelineDate(date) {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    }

    /**
     * Render reservation details
     * @param {Reservation} reservation - Reservation to render
     * @returns {string} HTML string for reservation details
     */
    renderReservationDetails(reservation) {
        return `
            <div class="reservation-details">
                <div class="detail-item">
                    <div class="detail-label">ID</div>
                    <div class="detail-value">${reservation.id}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Device</div>
                    <div class="detail-value">${reservation.device}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Region</div>
                    <div class="detail-value">${reservation.labRegion}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Start Date</div>
                    <div class="detail-value">${reservation.getFormattedStartDate()}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">End Date</div>
                    <div class="detail-value">${reservation.getFormattedEndDate()}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Duration</div>
                    <div class="detail-value">${reservation.getDuration()}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Requested By</div>
                    <div class="detail-value">${reservation.requestedBy}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="${reservation.getStatusClass()}">${reservation.status}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Display valid reservations
     * @param {Reservation[]} validReservations - Array of valid reservations
     */
    displayValidReservations(validReservations) {
        if (!this.validReservations) return;

        if (validReservations.length === 0) {
            this.validReservations.innerHTML = `
                <div class="valid-reservations">
                    <h3>Valid Reservations</h3>
                    <p>No valid reservations found. All new reservations have conflicts.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="valid-reservations">
                <h3>✅ Valid Reservations (${validReservations.length})</h3>
                <p>These reservations have no conflicts and can be processed normally.</p>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Device</th>
                                <th>Region</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Duration</th>
                                <th>Requested By</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        validReservations.forEach(reservation => {
            html += `
                <tr>
                    <td>${reservation.id}</td>
                    <td>${reservation.device}</td>
                    <td>${reservation.labRegion}</td>
                    <td>${reservation.getFormattedStartDate()}</td>
                    <td>${reservation.getFormattedEndDate()}</td>
                    <td>${reservation.getDuration()}</td>
                    <td>${reservation.requestedBy}</td>
                    <td><span class="${reservation.getStatusClass()}">${reservation.status}</span></td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.validReservations.innerHTML = html;
    }

    /**
     * Display loading state
     */
    showLoading() {
        if (this.summaryCards) {
            this.summaryCards.innerHTML = '<div class="loading-placeholder">Loading summary...</div>';
        }
        
        if (this.conflictsSection) {
            this.conflictsSection.innerHTML = '<div class="loading-placeholder">Analyzing conflicts...</div>';
        }
        
        if (this.validReservations) {
            this.validReservations.innerHTML = '<div class="loading-placeholder">Processing valid reservations...</div>';
        }
    }

    /**
     * Display error state
     * @param {string} message - Error message
     */
    showError(message) {
        const errorHTML = `
            <div class="error-state">
                <h3>❌ Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="upload-btn">Reload Page</button>
            </div>
        `;

        if (this.summaryCards) {
            this.summaryCards.innerHTML = errorHTML;
        }
    }

    /**
     * Export conflicts to CSV
     * @param {ConflictGroup[]} conflicts - Conflicts to export
     */
    exportConflictsToCSV(conflicts) {
        const csvData = [];
        
        // Add headers
        csvData.push([
            'Conflict Group',
            'Device',
            'Region',
            'Reservation ID',
            'Start Date',
            'End Date',
            'Duration',
            'Requested By',
            'Status',
            'Resolution',
            'Suggestion'
        ]);

        // Add conflict data
        conflicts.forEach((conflict, groupIndex) => {
            conflict.reservations.forEach(reservation => {
                const resolution = reservation.hasSuggestion() ? 'Reschedule' : 'Honored';
                const suggestion = reservation.suggestion || 'Original booking maintained';
                
                csvData.push([
                    `Group ${groupIndex + 1}`,
                    conflict.device,
                    conflict.labRegion,
                    reservation.id,
                    reservation.getFormattedStartDate(),
                    reservation.getFormattedEndDate(),
                    reservation.getDuration(),
                    reservation.requestedBy,
                    reservation.status,
                    resolution,
                    suggestion
                ]);
            });
        });

        // Convert to CSV string
        const csvString = csvData.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');

        // Download file
        this.downloadCSV(csvString, 'reservation_conflicts.csv');
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
     * Clear all displays
     */
    clear() {
        if (this.summaryCards) {
            this.summaryCards.innerHTML = '';
        }
        
        if (this.conflictsSection) {
            this.conflictsSection.innerHTML = '';
        }
        
        if (this.validReservations) {
            this.validReservations.innerHTML = '';
        }
    }

    /**
     * Get display statistics
     * @returns {Object} Display statistics
     */
    getDisplayStats() {
        return {
            hasSummary: this.summaryCards && this.summaryCards.innerHTML !== '',
            hasConflicts: this.conflictsSection && this.conflictsSection.innerHTML !== '',
            hasValidReservations: this.validReservations && this.validReservations.innerHTML !== ''
        };
    }
}