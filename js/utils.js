// Utility Functions
class Utils {
    // Date formatting
    static formatDate(date, format = 'short') {
        if (!date) return 'N/A';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';
        
        const options = {
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            long: { year: 'numeric', month: 'long', day: 'numeric' },
            datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
            time: { hour: '2-digit', minute: '2-digit' }
        };
        
        return d.toLocaleDateString('en-US', options[format] || options.short);
    }

    // Time ago formatting
    static timeAgo(date) {
        if (!date) return 'N/A';
        
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 30) return `${diffDays}d ago`;
        
        return this.formatDate(date);
    }

    // Stage badge styling
    static getStageClass(stage) {
        const stageClasses = {
            'PendingFirstVisit': 'stage-pending',
            'FollowUpNeeded': 'stage-followup',
            'ContractSent': 'stage-contract',
            'Won': 'stage-won',
            'Rejected': 'stage-rejected'
        };
        return stageClasses[stage] || 'stage-pending';
    }

    // Stage display names
    static getStageDisplayName(stage) {
        const stageNames = {
            'PendingFirstVisit': 'Pending First Visit',
            'FollowUpNeeded': 'Follow-up Needed',
            'ContractSent': 'Contract Sent',
            'Won': 'Won',
            'Rejected': 'Rejected'
        };
        return stageNames[stage] || stage;
    }

    // Category icons
    static getCategoryIcon(category) {
        const categoryIcons = {
            'Food': 'fas fa-utensils',
            'Desserts & Coffee': 'fas fa-coffee',
            'Beauty': 'fas fa-spa',
            'Clothing': 'fas fa-tshirt',
            'Services': 'fas fa-concierge-bell',
            'Sports': 'fas fa-dumbbell',
            'Entertainment': 'fas fa-film',
            'Tourism': 'fas fa-plane',
            'Health': 'fas fa-heartbeat',
            'Electronics': 'fas fa-laptop',
            'Education': 'fas fa-graduation-cap',
            'Application': 'fas fa-mobile-alt'
        };
        return categoryIcons[category] || 'fas fa-store';
    }

    // Student fit colors
    static getStudentFitClass(fit) {
        const fitClasses = {
            'Strong': 'text-green-600 bg-green-100',
            'Medium': 'text-yellow-600 bg-yellow-100',
            'Weak': 'text-red-600 bg-red-100'
        };
        return fitClasses[fit] || 'text-gray-600 bg-gray-100';
    }

    // Pricing tier colors
    static getPricingTierClass(tier) {
        const tierClasses = {
            'Budget': 'text-green-600 bg-green-100',
            'Mid': 'text-blue-600 bg-blue-100',
            'Premium': 'text-purple-600 bg-purple-100',
            'Luxury': 'text-yellow-600 bg-yellow-100'
        };
        return tierClasses[tier] || 'text-gray-600 bg-gray-100';
    }

    // Activity type icons
    static getActivityIcon(type) {
        const activityIcons = {
            'Call': 'fas fa-phone',
            'Meeting': 'fas fa-handshake',
            'WhatsApp': 'fab fa-whatsapp',
            'Email': 'fas fa-envelope',
            'Training': 'fas fa-chalkboard-teacher',
            'Other': 'fas fa-comment'
        };
        return activityIcons[type] || 'fas fa-comment';
    }

    // Generate random ID
    static generateId(prefix = 'item') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Format currency
    static formatCurrency(amount, currency = 'JOD') {
        return `${amount.toFixed(2)} ${currency}`;
    }

    // Calculate percentage
    static calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate phone number (basic)
    static isValidPhone(phone) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    // Sanitize HTML
    static sanitizeHtml(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Copy to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const result = document.execCommand('copy');
            document.body.removeChild(textArea);
            return result;
        }
    }

    // Show loading spinner
    static showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span class="ml-2 text-gray-600">Loading...</span>
                </div>
            `;
        }
    }

    // Hide element
    static hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('hidden');
        }
    }

    // Show element
    static showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
        }
    }

    // Toggle element visibility
    static toggleElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle('hidden');
        }
    }

    // Smooth scroll to element
    static scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Get URL parameters
    static getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Update URL without refresh
    static updateUrl(params) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key]) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.replaceState({}, '', url);
    }

    // Export data to CSV
    static exportToCSV(data, filename = 'export.csv') {
        if (!data || !data.length) {
            console.error('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Format number with commas
    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Capitalize first letter
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Truncate text
    static truncateText(text, maxLength = 50) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    // Get random color
    static getRandomColor() {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Show notification
    static showNotification(message, type = 'info', duration = 5000) {
        if (window.auth && window.auth.showNotification) {
            window.auth.showNotification(message, type);
        }
    }

    // Create modal
    static createModal(title, content, actions = []) {
        const modalId = `modal-${Date.now()}`;
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 modal-backdrop';
        
        const actionsHtml = actions.map(action => 
            `<button onclick="${action.onclick}" class="px-4 py-2 ${action.class || 'bg-blue-500 text-white'} rounded-md hover:opacity-80">${action.text}</button>`
        ).join('');

        modal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white modal-content">
                <div class="mt-3">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-gray-900">${title}</h3>
                        <button onclick="Utils.closeModal('${modalId}')" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="mt-2">
                        ${content}
                    </div>
                    <div class="flex justify-end space-x-3 mt-4">
                        <button onclick="Utils.closeModal('${modalId}')" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">Cancel</button>
                        ${actionsHtml}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        return modalId;
    }

    // Close modal
    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }

    // Validate form
    static validateForm(formElement) {
        const inputs = formElement.querySelectorAll('input[required], textarea[required], select[required]');
        let isValid = true;
        const errors = [];

        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                errors.push(`${input.name || input.id} is required`);
                input.classList.add('border-red-500');
            } else {
                input.classList.remove('border-red-500');
            }

            // Email validation
            if (input.type === 'email' && input.value && !this.isValidEmail(input.value)) {
                isValid = false;
                errors.push(`${input.name || input.id} must be a valid email`);
                input.classList.add('border-red-500');
            }

            // Phone validation
            if (input.type === 'tel' && input.value && !this.isValidPhone(input.value)) {
                isValid = false;
                errors.push(`${input.name || input.id} must be a valid phone number`);
                input.classList.add('border-red-500');
            }
        });

        return { isValid, errors };
    }

    // Format template string
    static formatTemplate(template, variables) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return variables[key] || match;
        });
    }

    // Generate WhatsApp URL
    static generateWhatsAppUrl(phone, message = '') {
        const cleanPhone = phone.replace(/[^\d+]/g, '');
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    }

    // Local storage helpers
    static getFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    static saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    // Performance helpers
    static measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }
}

// Make Utils available globally
window.Utils = Utils;