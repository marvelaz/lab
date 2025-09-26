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
                validRows: result.validRows
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
            const { totalRows, validRows } = rowCount;
            if (totalRows === validRows) {
                rowInfo = ` • <span>Rows: ${totalRows.toLocaleString()}</span>`;
            } else {
                rowInfo = ` • <span>Rows: ${validRows.toLocaleString()} valid / ${totalRows.toLocaleString()} total</span>`;
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
     * Reset file upload component
     */
    reset() {
        this.clearFileSelection();
        this.hideError();
        this.setLoadingState(false);
        this.updateUI();
    }
}