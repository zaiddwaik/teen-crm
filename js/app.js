// Main Application Controller
class TeenCRMApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.managers = {
            dashboard: window.dashboardManager,
            merchants: window.merchantManager,
            pipeline: window.pipelineManager,
            onboarding: window.onboardingManager,
            activities: window.activityManager,
            payouts: window.payoutManager
        };
        
        this.init();
    }

    init() {
        // Wait for auth system to initialize
        this.checkAuthAndInitialize();
    }

    checkAuthAndInitialize() {
        // Check if user is authenticated
        if (!window.auth.isLoggedIn()) {
            return; // Auth system will handle showing login
        }

        // User is authenticated, initialize the app
        this.initializeApp();
    }

    initializeApp() {
        const currentUser = window.auth.getCurrentUser();
        
        // Apply role-based access control
        this.applyRoleBasedAccess(currentUser);
        
        // Setup navigation
        this.setupNavigation();
        
        // Show initial section (dashboard)
        this.showSection('dashboard');
        
        // Setup responsive behavior
        this.setupResponsiveBehavior();
        
        console.log('Teen CRM initialized successfully for:', currentUser.name, `(${currentUser.role})`);
    }

    applyRoleBasedAccess(user) {
        // Hide/show navigation items based on role
        const navItems = {
            'dashboard': { roles: ['Admin', 'Rep'], element: 'dashboardTab' },
            'merchants': { roles: ['Admin', 'Rep'], element: 'merchantsTab' },
            'pipeline': { roles: ['Admin', 'Rep'], element: 'pipelineTab' },
            'onboarding': { roles: ['Admin', 'Rep'], element: 'onboardingTab' },
            'activities': { roles: ['Admin', 'Rep'], element: 'activitiesTab' },
            'payouts': { roles: ['Admin'], element: 'payoutsTab' } // Admin only
        };

        Object.entries(navItems).forEach(([section, config]) => {
            const element = document.getElementById(config.element);
            if (element) {
                if (config.roles.includes(user.role)) {
                    element.style.display = 'flex';
                    element.classList.remove('hidden');
                } else {
                    element.style.display = 'none';
                    element.classList.add('hidden');
                }
            }
        });

        // Set user-specific UI elements
        this.setUserSpecificUI(user);
    }

    setUserSpecificUI(user) {
        // Update user info display
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.textContent = `${user.name} (${user.role})`;
        }

        // Add role-specific styling
        document.body.classList.add(`role-${user.role.toLowerCase()}`);
        
        // Show role badge if needed
        this.addRoleBadge(user);
    }

    addRoleBadge(user) {
        const userInfo = document.getElementById('userInfo');
        if (!userInfo) return;

        // Create role badge
        const badge = document.createElement('span');
        badge.className = `ml-2 px-2 py-1 text-xs rounded-full ${
            user.role === 'Admin' ? 'bg-red-100 text-red-700' : 
            user.role === 'Rep' ? 'bg-blue-100 text-blue-700' : 
            'bg-gray-100 text-gray-700'
        }`;
        badge.textContent = user.role;
        
        // Clear existing badges and add new one
        const existingBadge = userInfo.querySelector('span');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        userInfo.appendChild(badge);
    }

    setupNavigation() {
        // Setup sidebar navigation
        const navLinks = document.querySelectorAll('.sidebar-item');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const sectionId = link.id.replace('Tab', '');
                this.showSection(sectionId);
            });
        });

        // Setup mobile menu toggle (if exists)
        this.setupMobileMenu();
    }

    setupMobileMenu() {
        // Check if we need to add mobile menu functionality
        const sidebar = document.querySelector('.w-64'); // Sidebar container
        if (!sidebar) return;

        // Create mobile menu button if not exists
        let mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (!mobileMenuBtn) {
            mobileMenuBtn = document.createElement('button');
            mobileMenuBtn.id = 'mobileMenuBtn';
            mobileMenuBtn.className = 'md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            
            // Add to navigation
            const nav = document.querySelector('nav .max-w-7xl .flex');
            if (nav) {
                nav.appendChild(mobileMenuBtn);
            }
        }

        // Mobile menu functionality
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('fixed');
            sidebar.classList.toggle('inset-0');
            sidebar.classList.toggle('z-50');
            sidebar.classList.toggle('md:relative');
            sidebar.classList.toggle('md:block');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 768 && 
                !sidebar.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('fixed', 'inset-0', 'z-50');
            }
        });
    }

    setupResponsiveBehavior() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Initial responsive setup
        this.handleResize();

        // Setup responsive tables
        this.setupResponsiveTables();
    }

    handleResize() {
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        
        // Update body classes for responsive behavior
        document.body.classList.toggle('mobile', isMobile);
        document.body.classList.toggle('tablet', isTablet);
        document.body.classList.toggle('desktop', window.innerWidth >= 1024);

        // Adjust chart sizes if needed
        this.adjustChartsForScreen();
        
        // Update mobile-specific UI elements
        if (isMobile) {
            this.optimizeForMobile();
        } else {
            this.optimizeForDesktop();
        }
    }

    setupResponsiveTables() {
        // Make tables responsive by wrapping them in scrollable containers
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
            if (!table.parentElement.classList.contains('overflow-x-auto')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'overflow-x-auto';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }

    optimizeForMobile() {
        // Optimize UI for mobile devices
        const grids = document.querySelectorAll('.grid');
        grids.forEach(grid => {
            if (grid.classList.contains('lg:grid-cols-4')) {
                grid.classList.add('grid-cols-1', 'sm:grid-cols-2');
            }
            if (grid.classList.contains('lg:grid-cols-3')) {
                grid.classList.add('grid-cols-1');
            }
        });

        // Adjust spacing for mobile
        const sections = document.querySelectorAll('.space-y-6');
        sections.forEach(section => {
            section.classList.add('space-y-4');
        });
    }

    optimizeForDesktop() {
        // Restore desktop optimizations
        // This runs when switching from mobile to desktop
        
        // Refresh current section to ensure proper layout
        if (this.managers[this.currentSection]) {
            // Re-render current section for desktop layout
            setTimeout(() => {
                this.managers[this.currentSection].render();
            }, 100);
        }
    }

    adjustChartsForScreen() {
        // Resize charts for current screen size
        Object.values(this.managers).forEach(manager => {
            if (manager.chartInstances) {
                Object.values(manager.chartInstances).forEach(chart => {
                    if (chart && chart.resize) {
                        chart.resize();
                    }
                });
            }
        });
    }

    showSection(sectionId) {
        const currentUser = window.auth.getCurrentUser();
        
        // Check permissions
        if (!this.hasAccessToSection(sectionId, currentUser)) {
            Utils.showNotification('You don\'t have permission to access this section', 'error');
            return;
        }

        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.add('hidden');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionId}Section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Update navigation
        this.updateNavigation(sectionId);

        // Render section content
        if (this.managers[sectionId]) {
            this.managers[sectionId].render();
        }

        // Update current section
        this.currentSection = sectionId;
        
        // Close mobile menu if open
        this.closeMobileMenu();
        
        // Update URL without refresh (for bookmarking)
        this.updateURL(sectionId);
    }

    hasAccessToSection(sectionId, user) {
        const permissions = {
            'dashboard': ['Admin', 'Rep'],
            'merchants': ['Admin', 'Rep'],
            'pipeline': ['Admin', 'Rep'],
            'onboarding': ['Admin', 'Rep'],
            'activities': ['Admin', 'Rep'],
            'payouts': ['Admin'] // Admin only
        };

        return permissions[sectionId]?.includes(user.role) || false;
    }

    updateNavigation(activeSection) {
        // Remove active class from all nav items
        const navItems = document.querySelectorAll('.sidebar-item');
        navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current section
        const activeItem = document.getElementById(`${activeSection}Tab`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.w-64');
        if (sidebar && window.innerWidth < 768) {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('fixed', 'inset-0', 'z-50');
        }
    }

    updateURL(sectionId) {
        // Update URL for bookmarking without page refresh
        const newURL = `${window.location.pathname}#${sectionId}`;
        window.history.replaceState({ section: sectionId }, '', newURL);
    }

    // Public methods for external access
    getCurrentSection() {
        return this.currentSection;
    }

    getCurrentUser() {
        return window.auth.getCurrentUser();
    }

    refreshCurrentSection() {
        if (this.managers[this.currentSection]) {
            this.managers[this.currentSection].render();
        }
    }

    // Notification system integration
    showNotification(message, type = 'info') {
        Utils.showNotification(message, type);
    }

    // Search functionality (global)
    initializeGlobalSearch() {
        // Add global search functionality if needed
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.performGlobalSearch(e.target.value);
            }, 300));
        }
    }

    performGlobalSearch(query) {
        if (!query || query.length < 2) return;

        const currentUser = window.auth.getCurrentUser();
        const merchants = window.dataStore.getMerchantsForUser(currentUser.id, currentUser.role);
        
        // Search merchants
        const merchantResults = merchants.filter(m => 
            m.merchantName.toLowerCase().includes(query.toLowerCase()) ||
            m.city.toLowerCase().includes(query.toLowerCase()) ||
            m.category.toLowerCase().includes(query.toLowerCase())
        );

        // Show search results
        this.showSearchResults(merchantResults, query);
    }

    showSearchResults(results, query) {
        // Implement search results UI
        console.log('Search results for:', query, results);
    }

    // Performance monitoring
    trackPerformance(action, data = {}) {
        // Track user actions for analytics
        console.log('Action tracked:', action, data);
        
        // In a real system, this would send data to analytics service
        const event = {
            action,
            data,
            timestamp: new Date().toISOString(),
            user: window.auth.getCurrentUser()?.id,
            section: this.currentSection
        };
        
        // Store in localStorage for demo purposes
        const events = JSON.parse(localStorage.getItem('teenCRM_events') || '[]');
        events.push(event);
        
        // Keep only last 100 events
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }
        
        localStorage.setItem('teenCRM_events', JSON.stringify(events));
    }

    // Error handling
    handleError(error, context = '') {
        console.error('TeenCRM Error:', error, context);
        
        // Show user-friendly error message
        Utils.showNotification(
            'An error occurred. Please try again or contact support if the issue persists.',
            'error'
        );
        
        // Track error for monitoring
        this.trackPerformance('error', {
            error: error.message,
            context,
            stack: error.stack
        });
    }

    // Cleanup and destroy
    destroy() {
        // Clean up event listeners and resources
        window.removeEventListener('resize', this.handleResize);
        
        // Destroy chart instances
        Object.values(this.managers).forEach(manager => {
            if (manager.chartInstances) {
                Object.values(manager.chartInstances).forEach(chart => {
                    if (chart && chart.destroy) {
                        chart.destroy();
                    }
                });
            }
        });
        
        console.log('Teen CRM app destroyed');
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        window.app = new TeenCRMApp();
        
        // Make app globally available for debugging
        window.teenCRM = {
            app: window.app,
            auth: window.auth,
            dataStore: window.dataStore,
            managers: {
                dashboard: window.dashboardManager,
                merchants: window.merchantManager,
                pipeline: window.pipelineManager,
                onboarding: window.onboardingManager,
                activities: window.activityManager,
                payouts: window.payoutManager
            },
            utils: Utils
        };
        
        console.log('🚀 Teen CRM loaded successfully!');
        console.log('Available in global scope as window.teenCRM');
        
    }, 100);
});

// Handle browser back/forward navigation
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.section && window.app) {
        window.app.showSection(e.state.section);
    }
});

// Handle initial URL hash
window.addEventListener('load', () => {
    const hash = window.location.hash.substring(1);
    if (hash && window.app) {
        setTimeout(() => {
            window.app.showSection(hash);
        }, 200);
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    if (window.app) {
        window.app.handleError(e.error, 'Global error handler');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    if (window.app) {
        window.app.handleError(new Error(e.reason), 'Unhandled promise rejection');
    }
    e.preventDefault();
});

// Service worker registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // In a production environment, you would register a service worker here
        console.log('Service worker support detected');
    });
}

// Export app for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeenCRMApp;
}