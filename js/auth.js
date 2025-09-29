// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('teenCRM_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        } else {
            this.showLogin();
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Show loading
        this.showLoading(true);

        try {
            // Simulate API call delay
            await this.delay(1000);

            // Validate credentials against sample users
            const user = this.validateCredentials(email, password);
            
            if (user) {
                this.currentUser = user;
                localStorage.setItem('teenCRM_user', JSON.stringify(user));
                
                this.showNotification('Login successful!', 'success');
                this.showMainApp();
            } else {
                this.showNotification('Invalid email or password', 'error');
            }
        } catch (error) {
            this.showNotification('Login failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    validateCredentials(email, password) {
        // Sample users matching the specification
        const users = [
            {
                id: 'admin-001',
                email: 'admin@teen-crm.com',
                password: 'admin123',
                name: 'Admin User',
                role: 'Admin',
                status: 'Active',
                phone: '+962 79 123 4567',
                createdAt: new Date('2024-01-01'),
                lastLoginAt: new Date()
            },
            {
                id: 'rep-001',
                email: 'sami@teen-crm.com',
                password: 'rep123',
                name: 'Sami Al-Ahmad',
                role: 'Rep',
                status: 'Active',
                phone: '+962 79 234 5678',
                createdAt: new Date('2024-01-15'),
                lastLoginAt: new Date()
            },
            {
                id: 'rep-002',
                email: 'layla@teen-crm.com',
                password: 'rep123',
                name: 'Layla Hassan',
                role: 'Rep',
                status: 'Active',
                phone: '+962 79 345 6789',
                createdAt: new Date('2024-02-01'),
                lastLoginAt: new Date()
            }
        ];

        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            // Don't store password in session
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('teenCRM_user');
        this.showNotification('Logged out successfully', 'success');
        this.showLogin();
    }

    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        
        // Clear form
        const form = document.getElementById('loginForm');
        if (form) form.reset();
        
        // Set default values for demo
        document.getElementById('email').value = 'admin@teen-crm.com';
        document.getElementById('password').value = 'admin123';
    }

    showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
        // Update user info
        const userInfo = document.getElementById('userInfo');
        if (userInfo && this.currentUser) {
            userInfo.textContent = `${this.currentUser.name} (${this.currentUser.role})`;
        }

        // Initialize the application
        if (window.app) {
            window.app.init();
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const id = Date.now();
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const notification = document.createElement('div');
        notification.id = `notification-${id}`;
        notification.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg mb-2 fade-in flex items-center space-x-2`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-auto">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            const element = document.getElementById(`notification-${id}`);
            if (element) {
                element.remove();
            }
        }, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Utility methods
    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    isAdmin() {
        return this.hasRole('Admin');
    }

    isRep() {
        return this.hasRole('Rep');
    }

    getCurrentUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }
}

// Initialize auth system
window.auth = new AuthSystem();