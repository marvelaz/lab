// Navigation Component - Handles page navigation and tab switching
class Navigation {
    constructor() {
        this.currentPage = 'validation';
        this.pages = ['validation', 'statistics', 'power', 'help'];
        this.navTabs = null;
        this.pageElements = null;
    }

    /**
     * Initialize navigation component
     */
    init() {
        this.navTabs = document.querySelectorAll('.nav-tab');
        this.pageElements = document.querySelectorAll('.page');
        
        this.setupEventListeners();
        this.showPage(this.currentPage);
        
        console.log('Navigation component initialized');
    }

    /**
     * Set up navigation event listeners
     */
    setupEventListeners() {
        this.navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const pageId = e.target.getAttribute('data-page');
                this.navigateToPage(pageId);
            });
        });

        // Handle "Go to Validation" button in statistics page
        const goToValidationBtn = document.getElementById('goToValidationBtn');
        if (goToValidationBtn) {
            goToValidationBtn.addEventListener('click', () => {
                this.navigateToPage('validation');
            });
        }

        // Handle "Go to Power Validation" button in power page
        const goToPowerValidationBtn = document.getElementById('goToPowerValidationBtn');
        if (goToPowerValidationBtn) {
            goToPowerValidationBtn.addEventListener('click', () => {
                this.navigateToPage('validation');
            });
        }

        // Handle help page table of contents links
        this.setupHelpPageNavigation();

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const pageId = e.state?.pageId || 'validation';
            this.showPage(pageId, false);
        });
    }

    /**
     * Navigate to a specific page
     * @param {string} pageId - Target page ID
     */
    navigateToPage(pageId) {
        if (!this.pages.includes(pageId)) {
            console.warn(`Invalid page ID: ${pageId}`);
            return;
        }

        if (pageId === this.currentPage) {
            return; // Already on this page
        }

        this.showPage(pageId, true);
    }

    /**
     * Show a specific page
     * @param {string} pageId - Page ID to show
     * @param {boolean} updateHistory - Whether to update browser history
     */
    showPage(pageId, updateHistory = false) {
        // Hide all pages
        this.pageElements.forEach(page => {
            page.classList.remove('active');
        });

        // Remove active class from all tabs
        this.navTabs.forEach(tab => {
            tab.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(pageId);
        const targetTab = document.querySelector(`[data-page="${pageId}"]`);

        if (targetPage && targetTab) {
            targetPage.classList.add('active');
            targetTab.classList.add('active');
            
            this.currentPage = pageId;

            // Update browser history
            if (updateHistory) {
                const url = new URL(window.location);
                url.searchParams.set('page', pageId);
                window.history.pushState({ pageId }, '', url);
            }

            // Dispatch page change event
            this.dispatchPageChangeEvent(pageId);
            
            console.log(`Navigated to page: ${pageId}`);
        } else {
            console.error(`Page or tab not found: ${pageId}`);
        }
    }

    /**
     * Dispatch page change event
     * @param {string} pageId - Current page ID
     */
    dispatchPageChangeEvent(pageId) {
        const event = new CustomEvent('pageChanged', {
            detail: {
                pageId: pageId,
                previousPage: this.currentPage
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Get current page ID
     * @returns {string} Current page ID
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * Check if a page is currently active
     * @param {string} pageId - Page ID to check
     * @returns {boolean} True if page is active
     */
    isPageActive(pageId) {
        return this.currentPage === pageId;
    }

    /**
     * Enable or disable a navigation tab
     * @param {string} pageId - Page ID
     * @param {boolean} enabled - Whether to enable the tab
     */
    setTabEnabled(pageId, enabled) {
        const tab = document.querySelector(`[data-page="${pageId}"]`);
        if (tab) {
            if (enabled) {
                tab.removeAttribute('disabled');
                tab.style.opacity = '1';
                tab.style.cursor = 'pointer';
            } else {
                tab.setAttribute('disabled', 'true');
                tab.style.opacity = '0.5';
                tab.style.cursor = 'not-allowed';
            }
        }
    }

    /**
     * Add a badge or indicator to a tab
     * @param {string} pageId - Page ID
     * @param {string} text - Badge text
     * @param {string} className - CSS class for styling
     */
    addTabBadge(pageId, text, className = 'nav-badge') {
        const tab = document.querySelector(`[data-page="${pageId}"]`);
        if (tab) {
            // Remove existing badge
            const existingBadge = tab.querySelector('.nav-badge');
            if (existingBadge) {
                existingBadge.remove();
            }

            // Add new badge
            const badge = document.createElement('span');
            badge.className = className;
            badge.textContent = text;
            badge.style.cssText = `
                margin-left: 8px;
                background: #dc3545;
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
            `;
            
            tab.appendChild(badge);
        }
    }

    /**
     * Remove badge from a tab
     * @param {string} pageId - Page ID
     */
    removeTabBadge(pageId) {
        const tab = document.querySelector(`[data-page="${pageId}"]`);
        if (tab) {
            const badge = tab.querySelector('.nav-badge');
            if (badge) {
                badge.remove();
            }
        }
    }

    /**
     * Initialize page from URL parameters
     */
    initializeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const pageId = urlParams.get('page');
        
        if (pageId && this.pages.includes(pageId)) {
            this.showPage(pageId, false);
        }
    }

    /**
     * Get navigation state
     * @returns {Object} Navigation state
     */
    getState() {
        return {
            currentPage: this.currentPage,
            availablePages: this.pages,
            tabStates: Array.from(this.navTabs).map(tab => ({
                pageId: tab.getAttribute('data-page'),
                active: tab.classList.contains('active'),
                disabled: tab.hasAttribute('disabled')
            }))
        };
    }

    /**
     * Setup help page table of contents navigation
     */
    setupHelpPageNavigation() {
        // Add smooth scrolling for help page anchor links
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('toc-link')) {
                e.preventDefault();
                const targetId = e.target.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement && this.currentPage === 'help') {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Add highlight effect
                    targetElement.style.backgroundColor = '#e3f2fd';
                    setTimeout(() => {
                        targetElement.style.backgroundColor = '';
                    }, 2000);
                }
            }
        });
    }

    /**
     * Reset navigation to initial state
     */
    reset() {
        this.showPage('validation', true);
        
        // Remove all badges
        this.pages.forEach(pageId => {
            this.removeTabBadge(pageId);
            this.setTabEnabled(pageId, true);
        });
    }
}