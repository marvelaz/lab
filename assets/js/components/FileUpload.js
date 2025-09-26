// File Upload Component - Handles CSV file upload and processing
class FileUpload {
    constructor(dataService) {
        this.dataService = dataService;
        this.fileInput = null;
        this.uploadBtn = null;
        this.validateBtn = null;
        this.fileName = null;
        this.currentFile = null;
    }

    /**
     * Initialize file upload component
     */
    init() {
        this.fileInput = document.getElementById('csvFile');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.validateBtn = document.getElementById('validateBtn');
        this.fileName = document.getElementById('fileName');

        this.setupEventListeners();
        this.updateUI();

        console.log('FileUpload component initialized');
    }

    /**
     * Set up file upload event listeners
     */
    setupEventListeners() {
        // Upload button click
        this.uploadBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files[0]);
        });

        // Validate button click
        this.validateBtn.addEventListener('click', () => {
            this.handleValidationRequest();
        });

        // Drag and drop support
        this.setupDragAndDrop();
    }

    /**
     * Set up drag and drop functionality
     */
    setupDragAndDrop() {
        const uploadSection = document.querySelector('.upload-section');

        if (!uploadSection) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadSection.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadSection.addEventListener(eventName, () => {
                uploadSection.classList.add('drag-highlight');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadSection.addEventListener(eventName, () => {
                uploadSection.classList.remove('drag-highlight');
            }, false);
        });

        // Handle dropped files
        uploadSection.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        }, false);
    }

    /**
     * Prevent default drag behaviors
     * @param {Event} e - Event object
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Handle file selection
     * @param {File} file - Selected file
     */
    async handleFileSelection(file) {
        if (!file) {
            this.clearFileSelection();
            return;
        }

        try {
            // Validate file
            if (!this.validateFile(file)) {
                this.showError('Please select a valid CSV file (max 10MB)');
                return;
            }

            this.currentFile = file;
            this.updateFileDisplay(file);

            // Load and process file
            await this.loadFile(file);

        } catch (error) {
            Utils.logError('FileUpload.handleFileSelection', error);
            this.showError('Failed to process file. Please try again.');
            this.clearFileSelection();
        }
    }

    /**
     * Validate selected file
     * @param {File} file - File to validate
     * @returns {boolean} True if file is valid
     */
    validateFile(file) {
        // Check file type
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!CONFIG.FILE.ACCEPTED_TYPES.includes(fileExtension)) {
            return false;
        }

        // Check file size
        if (file.size > CONFIG.FILE.MAX_SIZE) {
            return false;
        }

        // Check if file is empty
        if (file.size === 0) {
            return false;
        }

        return true;
    }

    /**
     * Load and process CSV file
     * @param {File} file - File to load
     */
    async loadFile(file) {
        try {
            this.setLoadingState(true);

            // Show processing status
            this.updateFileDisplay(file, 'processing');

            const result = await this.dataService.loadCSVFile(file);

            this.setLoadingState(false);

            // Update file display with row counts
            this.updateFileDisplay(file, {
                totalRows: result.totalRows,
                validRows: result.validRows,
                invalidRows: result.invalidRows
            });
            this.updateUI();

            // Dispatch file loaded event
            this.dispatchFileUploadedEvent(file, result.reservations);

            console.log(`Successfully loaded ${result.validRows} valid reservations from ${result.totalRows} total rows`);

        } catch (error) {
            this.setLoadingState(false);
            throw error;
        }
    }

    /**
     * Handle validation request
     */
    handleValidationRequest() {
        if (!this.dataService.isDataProcessed()) {
            this.showError('Please upload a CSV file first');
            return;
        }

        // Dispatch validation requested event
        const event = new CustomEvent('validationRequested');
        document.dispatchEvent(event);
    }

    /**
     * Update file display
     * @param {File} file - Selected file
     * @param {number|string|Object} rowCount - Number of rows, "processing", row object, or null
     */
    updateFileDisplay(file, rowCount = null) {
        const fileSize = this.formatFileSize(file.size);
        const lastModified = new Date(file.lastModified).toLocaleDateString();

        let rowInfo = '';
        if (rowCount === 'processing') {
            rowInfo = ` • <span>Processing...</span>`;
        } else if (typeof rowCount === 'number') {
            rowInfo = ` • <span>Rows: ${rowCount.toLocaleString()}</span>`;
        } else if (rowCount && typeof rowCount === 'object') {
            const { totalRows, validRows, invalidRows } = rowCount;
            if (totalRows === validRows) {
                rowInfo = ` • <span>Rows: ${totalRows.toLocaleString()}</span>`;
            } else {
                const invalidCount = invalidRows ? invalidRows.length : (totalRows - validRows);
                rowInfo = ` • <span>Rows: ${validRows.toLocaleString()} valid / ${totalRows.toLocaleString()} total</span>`;
                if (invalidCount > 0) {
                    rowInfo += ` • <span class="invalid-rows-link" style="color: #dc3545; cursor: pointer; text-decoration: underline;">${invalidCount} invalid rows</span>`;
                }
            }
        }

        this.fileName.innerHTML = `
            <div class="file-info">
                <div class="file-name">📄 ${file.name}</div>
                <div class="file-details">
                    <span>Size: ${fileSize}</span> • 
                    <span>Modified: ${lastModified}</span>${rowInfo}
                </div>
            </div>
        `;

        this.fileName.style.display = 'block';

        // Add click handler for invalid rows link
        const invalidRowsLink = this.fileName.querySelector('.invalid-rows-link');
        if (invalidRowsLink) {
            invalidRowsLink.addEventListener('click', () => {
                this.showInvalidRowsModal();
            });
        }
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Clear file selection
     */
    clearFileSelection() {
        this.currentFile = null;
        this.fileInput.value = '';
        this.fileName.style.display = 'none';
        this.fileName.innerHTML = '';
        this.updateUI();
    }

    /**
     * Update UI state based on current state
     */
    updateUI() {
        const hasFile = this.currentFile !== null;
        const hasData = this.dataService.isDataProcessed();

        // Update validate button state
        this.validateBtn.disabled = !hasData;

        // Update button text
        if (hasFile && hasData) {
            this.validateBtn.textContent = 'Validate Reservations';
        } else if (hasFile) {
            this.validateBtn.textContent = 'Processing...';
        } else {
            this.validateBtn.textContent = 'Validate Reservations';
        }
    }

    /**
     * Set loading state
     * @param {boolean} loading - Whether component is loading
     */
    setLoadingState(loading) {
        this.uploadBtn.disabled = loading;
        this.validateBtn.disabled = loading;

        if (loading) {
            this.uploadBtn.textContent = 'Processing...';
        } else {
            this.uploadBtn.textContent = 'Choose CSV File';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create or update error display
        let errorDiv = document.querySelector('.upload-error');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'upload-error';
            errorDiv.style.cssText = `
                background: #f8d7da;
                color: #721c24;
                padding: 12px;
                margin-top: 16px;
                border: 1px solid #f5c6cb;
                border-radius: 4px;
                font-size: 14px;
            `;

            this.fileName.parentNode.appendChild(errorDiv);
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }, 5000);
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorDiv = document.querySelector('.upload-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    /**
     * Dispatch file uploaded event
     * @param {File} file - Uploaded file
     * @param {Reservation[]} reservations - Processed reservations
     */
    dispatchFileUploadedEvent(file, reservations) {
        const event = new CustomEvent('fileUploaded', {
            detail: {
                file: file,
                fileName: file.name,
                fileSize: file.size,
                reservations: reservations,
                reservationCount: reservations.length
            }
        });

        document.dispatchEvent(event);
    }

    /**
     * Get current file information
     * @returns {Object|null} File information or null
     */
    getCurrentFileInfo() {
        if (!this.currentFile) return null;

        return {
            name: this.currentFile.name,
            size: this.currentFile.size,
            type: this.currentFile.type,
            lastModified: this.currentFile.lastModified
        };
    }

    /**
     * Show invalid rows modal for inspection and fixing
     */
    showInvalidRowsModal() {
        if (!this.dataService.isDataProcessed()) return;

        const invalidRows = this.dataService.getInvalidRows();
        const validationSummary = this.dataService.getValidationSummary();

        if (invalidRows.length === 0) {
            alert('No invalid rows found!');
            return;
        }

        // Create modal
        const modal = this.createInvalidRowsModal(invalidRows, validationSummary);
        document.body.appendChild(modal);

        // Show modal
        modal.style.display = 'flex';
    }

    /**
     * Create invalid rows modal
     * @param {Array} invalidRows - Array of invalid row objects
     * @param {Object} validationSummary - Validation summary
     * @returns {HTMLElement} Modal element
     */
    createInvalidRowsModal(invalidRows, validationSummary) {
        const modal = document.createElement('div');
        modal.className = 'invalid-rows-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 24px;
            max-width: 90vw;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;

        modalContent.innerHTML = `
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e5e5e5; padding-bottom: 16px;">
                <h2 style="margin: 0; color: #1a1a1a;">Invalid Rows Analysis</h2>
                <button class="close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
            </div>
            
            <div class="validation-summary" style="background: #f8f9fa; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 12px 0; color: #1a1a1a;">Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                    <div><strong>Total Rows:</strong> ${validationSummary.totalRows}</div>
                    <div><strong>Valid Rows:</strong> ${validationSummary.validRows}</div>
                    <div style="color: #dc3545;"><strong>Invalid Rows:</strong> ${validationSummary.invalidRows}</div>
                    <div style="color: #dc3545;"><strong>Errors:</strong> ${validationSummary.issuesBySeverity.error}</div>
                    <div style="color: #ffc107;"><strong>Warnings:</strong> ${validationSummary.issuesBySeverity.warning}</div>
                </div>
            </div>

            <div class="modal-actions" style="margin-bottom: 20px;">
                <button id="autoFixBtn" class="auto-fix-btn" style="background: #28a745; color: white; border: none; padding: 10px 16px; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                    🔧 Try Auto-Fix
                </button>
                <button id="exportInvalidBtn" class="export-invalid-btn" style="background: #6c757d; color: white; border: none; padding: 10px 16px; border-radius: 4px; cursor: pointer;">
                    📄 Export Invalid Rows
                </button>
            </div>

            <div class="invalid-rows-list">
                <h3 style="margin: 0 0 16px 0; color: #1a1a1a;">Invalid Rows Details</h3>
                <div class="rows-container" style="max-height: 400px; overflow-y: auto;">
                    ${this.generateInvalidRowsHTML(invalidRows)}
                </div>
            </div>
        `;

        modal.appendChild(modalContent);

        // Add event listeners
        modalContent.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modalContent.querySelector('#autoFixBtn').addEventListener('click', () => {
            this.handleAutoFix(modal);
        });

        modalContent.querySelector('#exportInvalidBtn').addEventListener('click', () => {
            this.exportInvalidRows(invalidRows);
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        return modal;
    }

    /**
     * Generate HTML for invalid rows display
     * @param {Array} invalidRows - Array of invalid row objects
     * @returns {string} HTML string
     */
    generateInvalidRowsHTML(invalidRows) {
        return invalidRows.map(invalidRow => {
            const issuesHTML = invalidRow.issues.map(issue => {
                const severityColor = issue.severity === 'error' ? '#dc3545' : '#ffc107';
                const suggestionHTML = issue.suggestion ?
                    `<div style="font-size: 0.8em; color: #666; margin-top: 4px;">💡 ${issue.suggestion}</div>` : '';

                return `
                    <div style="margin-bottom: 8px; padding: 8px; background: ${issue.severity === 'error' ? '#f8d7da' : '#fff3cd'}; border-radius: 4px;">
                        <div style="font-weight: 600; color: ${severityColor};">
                            ${issue.field}: ${issue.issue}
                        </div>
                        <div style="font-size: 0.9em; color: #666;">
                            Value: "${issue.value || '(empty)'}"
                        </div>
                        ${suggestionHTML}
                    </div>
                `;
            }).join('');

            return `
                <div style="border: 1px solid #e5e5e5; border-radius: 6px; padding: 16px; margin-bottom: 16px; background: white;">
                    <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 12px;">
                        Row ${invalidRow.rowIndex} - ${invalidRow.issues.length} issue(s)
                    </div>
                    ${issuesHTML}
                </div>
            `;
        }).join('');
    }

    /**
     * Handle auto-fix attempt
     * @param {HTMLElement} modal - Modal element
     */
    async handleAutoFix(modal) {
        const autoFixBtn = modal.querySelector('#autoFixBtn');
        const originalText = autoFixBtn.textContent;

        autoFixBtn.textContent = '🔧 Fixing...';
        autoFixBtn.disabled = true;

        try {
            const fixResults = this.dataService.attemptAutoFix();

            if (fixResults.fixedCount > 0) {
                // Apply the fixes
                this.dataService.applyFixes(fixResults.fixedRows);

                // Update file display
                this.updateFileDisplay(this.currentFile, {
                    totalRows: fixResults.totalAttempted + this.dataService.reservations.length,
                    validRows: this.dataService.reservations.length,
                    invalidRows: fixResults.stillInvalidRows
                });

                // Show success message
                alert(`Successfully fixed ${fixResults.fixedCount} out of ${fixResults.totalAttempted} invalid rows!`);

                // Close modal and refresh if all fixed
                if (fixResults.stillInvalidCount === 0) {
                    document.body.removeChild(modal);
                } else {
                    // Refresh modal with remaining invalid rows
                    const newModal = this.createInvalidRowsModal(
                        fixResults.stillInvalidRows,
                        this.dataService.getValidationSummary()
                    );
                    document.body.replaceChild(newModal, modal);
                    newModal.style.display = 'flex';
                }
            } else {
                alert('No rows could be automatically fixed. Manual review required.');
            }
        } catch (error) {
            console.error('Auto-fix failed:', error);
            alert('Auto-fix failed. Please try manual review.');
        }

        autoFixBtn.textContent = originalText;
        autoFixBtn.disabled = false;
    }

    /**
     * Export invalid rows to CSV for manual review
     * @param {Array} invalidRows - Array of invalid row objects
     */
    exportInvalidRows(invalidRows) {
        const csvData = [];

        // Add headers
        csvData.push(['Row Number', 'Field', 'Issue', 'Current Value', 'Severity', 'Suggestion']);

        // Add invalid row data
        invalidRows.forEach(invalidRow => {
            invalidRow.issues.forEach(issue => {
                csvData.push([
                    invalidRow.rowIndex,
                    issue.field,
                    issue.issue,
                    issue.value || '(empty)',
                    issue.severity,
                    issue.suggestion || ''
                ]);
            });
        });

        // Convert to CSV string
        const csvString = csvData.map(row =>
            row.map(field => `"${field}"`).join(',')
        ).join('\n');

        // Download file
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'invalid_rows_analysis.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Reset file upload component
     */
    reset() {
        this.clearFileSelection();
        this.hideError();
        this.setLoadingState(false);
        this.updateUI();
    }
}