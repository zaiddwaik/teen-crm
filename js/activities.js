// Activity Management System
class ActivityManager {
    constructor() {
        this.selectedMerchant = '';
        this.selectedType = '';
        this.selectedDateRange = '30_days';
    }

    render() {
        const section = document.getElementById('activitiesSection');
        
        section.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Activities</h1>
                        <p class="text-gray-600">Track and log merchant interactions</p>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="activityManager.showAddActivityForm()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                            <i class="fas fa-plus"></i>
                            <span>Log Activity</span>
                        </button>
                        <button onclick="activityManager.exportActivities()" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2">
                            <i class="fas fa-download"></i>
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                <!-- Activity Overview -->
                <div id="activityOverview" class="bg-white rounded-lg shadow p-6">
                    <!-- Overview stats will be loaded here -->
                </div>

                <!-- Filters -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Merchant</label>
                            <select id="activityMerchantFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Merchants</option>
                                ${this.getMerchantOptions()}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                            <select id="activityTypeFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Types</option>
                                <option value="Call">Call</option>
                                <option value="Meeting">Meeting</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Email">Email</option>
                                <option value="Training">Training</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                            <select id="activityDateFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="7_days">Last 7 Days</option>
                                <option value="30_days" selected>Last 30 Days</option>
                                <option value="90_days">Last 90 Days</option>
                                <option value="this_month">This Month</option>
                                <option value="last_month">Last Month</option>
                                <option value="all_time">All Time</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button onclick="activityManager.clearFilters()" class="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                                <i class="fas fa-times mr-1"></i>Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <button onclick="activityManager.showQuickActivityForm('Call')" 
                            class="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group">
                        <div class="text-center">
                            <i class="fas fa-phone text-blue-600 text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <div class="text-sm font-medium text-blue-900">Quick Call</div>
                        </div>
                    </button>
                    
                    <button onclick="activityManager.showQuickActivityForm('Meeting')" 
                            class="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors group">
                        <div class="text-center">
                            <i class="fas fa-handshake text-green-600 text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <div class="text-sm font-medium text-green-900">Meeting</div>
                        </div>
                    </button>
                    
                    <button onclick="activityManager.showQuickActivityForm('WhatsApp')" 
                            class="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors group">
                        <div class="text-center">
                            <i class="fab fa-whatsapp text-green-600 text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <div class="text-sm font-medium text-green-900">WhatsApp</div>
                        </div>
                    </button>
                    
                    <button onclick="activityManager.showQuickActivityForm('Email')" 
                            class="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group">
                        <div class="text-center">
                            <i class="fas fa-envelope text-purple-600 text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <div class="text-sm font-medium text-purple-900">Email</div>
                        </div>
                    </button>
                    
                    <button onclick="activityManager.showQuickActivityForm('Training')" 
                            class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors group">
                        <div class="text-center">
                            <i class="fas fa-chalkboard-teacher text-yellow-600 text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <div class="text-sm font-medium text-yellow-900">Training</div>
                        </div>
                    </button>
                    
                    <button onclick="activityManager.showQuickActivityForm('Other')" 
                            class="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group">
                        <div class="text-center">
                            <i class="fas fa-comment text-gray-600 text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <div class="text-sm font-medium text-gray-900">Other</div>
                        </div>
                    </button>
                </div>

                <!-- Activities Timeline -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-900">Activity Timeline</h2>
                    </div>
                    <div id="activitiesTimeline" class="p-6">
                        <!-- Timeline will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadActivityData();
        this.loadActivityOverview();
    }

    setupEventListeners() {
        const merchantFilter = document.getElementById('activityMerchantFilter');
        const typeFilter = document.getElementById('activityTypeFilter');
        const dateFilter = document.getElementById('activityDateFilter');

        if (merchantFilter) {
            merchantFilter.addEventListener('change', (e) => {
                this.selectedMerchant = e.target.value;
                this.loadActivityData();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.selectedType = e.target.value;
                this.loadActivityData();
            });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.selectedDateRange = e.target.value;
                this.loadActivityData();
                this.loadActivityOverview();
            });
        }
    }

    loadActivityOverview() {
        const currentUser = window.auth.getCurrentUser();
        const activities = this.getActivitiesForDateRange(this.selectedDateRange);
        const metrics = this.calculateActivityMetrics(activities);
        
        const overviewContainer = document.getElementById('activityOverview');
        overviewContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Total Activities -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-gray-900">${metrics.total}</div>
                    <div class="text-sm text-gray-600">Total Activities</div>
                    <div class="text-xs text-gray-500">${this.getDateRangeDisplayName()}</div>
                </div>
                
                <!-- Today's Activities -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-blue-600">${metrics.today}</div>
                    <div class="text-sm text-gray-600">Today's Activities</div>
                    <div class="text-xs text-gray-500">${metrics.todayPercentage}% of total</div>
                </div>
                
                <!-- Most Active Type -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-green-600">${metrics.mostActiveType.count}</div>
                    <div class="text-sm text-gray-600">${metrics.mostActiveType.type}</div>
                    <div class="text-xs text-gray-500">Most common type</div>
                </div>
                
                <!-- Active Merchants -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-purple-600">${metrics.activeMerchants}</div>
                    <div class="text-sm text-gray-600">Active Merchants</div>
                    <div class="text-xs text-gray-500">With recent activity</div>
                </div>
            </div>

            <!-- Activity Type Breakdown -->
            <div class="mt-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Activity Type Distribution</h3>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    ${Object.entries(metrics.typeBreakdown).map(([type, count]) => `
                        <div class="text-center p-3 bg-gray-50 rounded-lg">
                            <div class="text-lg ${Utils.getActivityIcon(type)} text-gray-600 mb-1"></div>
                            <div class="text-lg font-semibold text-gray-900">${count}</div>
                            <div class="text-sm text-gray-600">${type}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    calculateActivityMetrics(activities) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysActivities = activities.filter(a => {
            const activityDate = new Date(a.occurredAt);
            activityDate.setHours(0, 0, 0, 0);
            return activityDate.getTime() === today.getTime();
        });

        // Type breakdown
        const typeBreakdown = {
            'Call': 0,
            'Meeting': 0,
            'WhatsApp': 0,
            'Email': 0,
            'Training': 0,
            'Other': 0
        };

        activities.forEach(activity => {
            typeBreakdown[activity.type]++;
        });

        // Find most active type
        const mostActiveType = Object.entries(typeBreakdown).reduce((max, [type, count]) => 
            count > max.count ? { type, count } : max, { type: 'None', count: 0 });

        // Count active merchants (merchants with activities in the period)
        const activeMerchants = new Set(activities.map(a => a.merchantId)).size;

        return {
            total: activities.length,
            today: todaysActivities.length,
            todayPercentage: activities.length > 0 ? Math.round((todaysActivities.length / activities.length) * 100) : 0,
            mostActiveType,
            activeMerchants,
            typeBreakdown
        };
    }

    loadActivityData() {
        const activities = this.getActivitiesForDateRange(this.selectedDateRange);
        
        // Apply filters
        let filteredActivities = activities;
        
        if (this.selectedMerchant) {
            filteredActivities = filteredActivities.filter(a => a.merchantId === this.selectedMerchant);
        }
        
        if (this.selectedType) {
            filteredActivities = filteredActivities.filter(a => a.type === this.selectedType);
        }

        // Sort by date (newest first)
        filteredActivities.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));

        this.renderActivitiesTimeline(filteredActivities);
    }

    renderActivitiesTimeline(activities) {
        const container = document.getElementById('activitiesTimeline');
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-history text-gray-400 text-4xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                    <p class="text-gray-600">Start logging your merchant interactions to see them here.</p>
                    <button onclick="activityManager.showAddActivityForm()" 
                            class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Log Your First Activity
                    </button>
                </div>
            `;
            return;
        }

        // Group activities by date
        const groupedActivities = this.groupActivitiesByDate(activities);
        
        container.innerHTML = `
            <div class="activity-timeline relative">
                ${Object.entries(groupedActivities).map(([date, dayActivities]) => 
                    this.renderActivityDay(date, dayActivities)
                ).join('')}
            </div>
        `;
    }

    groupActivitiesByDate(activities) {
        const grouped = {};
        
        activities.forEach(activity => {
            const date = new Date(activity.occurredAt).toDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(activity);
        });
        
        return grouped;
    }

    renderActivityDay(date, activities) {
        const displayDate = new Date(date);
        const isToday = displayDate.toDateString() === new Date().toDateString();
        const isYesterday = displayDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
        
        let dateLabel = Utils.formatDate(displayDate);
        if (isToday) dateLabel = 'Today';
        else if (isYesterday) dateLabel = 'Yesterday';
        
        return `
            <div class="mb-8">
                <!-- Date Header -->
                <div class="flex items-center mb-4">
                    <div class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        ${dateLabel}
                    </div>
                    <div class="flex-1 border-t border-gray-200 ml-4"></div>
                    <div class="text-sm text-gray-500 ml-4">
                        ${activities.length} ${activities.length === 1 ? 'activity' : 'activities'}
                    </div>
                </div>
                
                <!-- Activities for this day -->
                <div class="space-y-4 ml-6">
                    ${activities.map(activity => this.renderActivityItem(activity)).join('')}
                </div>
            </div>
        `;
    }

    renderActivityItem(activity) {
        const merchant = window.dataStore.findItem('merchants', activity.merchantId);
        const repName = this.getRepName(activity.repId);
        const currentUser = window.auth.getCurrentUser();
        const canEdit = currentUser.role === 'Admin' || activity.repId === currentUser.id;

        return `
            <div class="activity-item bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="activity-dot"></div>
                
                <!-- Activity Header -->
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="${Utils.getActivityIcon(activity.type)} text-blue-600 text-sm"></i>
                        </div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <span class="font-medium text-gray-900">${activity.type}</span>
                                <span class="text-gray-500">•</span>
                                <span class="text-sm text-gray-600">${merchant ? merchant.merchantName : 'Unknown Merchant'}</span>
                            </div>
                            <div class="text-sm text-gray-500">
                                ${Utils.formatDate(activity.occurredAt, 'datetime')} by ${repName}
                            </div>
                        </div>
                    </div>
                    
                    ${canEdit ? `
                        <div class="flex space-x-2">
                            <button onclick="activityManager.editActivity('${activity.id}')" 
                                    class="text-gray-400 hover:text-blue-600" title="Edit">
                                <i class="fas fa-edit text-sm"></i>
                            </button>
                            <button onclick="activityManager.deleteActivity('${activity.id}')" 
                                    class="text-gray-400 hover:text-red-600" title="Delete">
                                <i class="fas fa-trash text-sm"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>

                <!-- Activity Summary -->
                <div class="ml-11">
                    <p class="text-gray-700 leading-relaxed">${activity.summary}</p>
                    
                    ${activity.attachmentUrl ? `
                        <div class="mt-3 p-2 bg-gray-50 rounded border inline-flex items-center space-x-2">
                            <i class="fas fa-paperclip text-gray-500"></i>
                            <a href="${activity.attachmentUrl}" target="_blank" 
                               class="text-blue-600 hover:underline text-sm">View Attachment</a>
                        </div>
                    ` : ''}

                    <!-- Quick Actions -->
                    ${merchant ? `
                        <div class="flex space-x-4 mt-3 pt-3 border-t border-gray-100">
                            ${merchant.phoneMain ? `
                                <button onclick="window.location.href='tel:${merchant.phoneMain}'" 
                                        class="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1">
                                    <i class="fas fa-phone"></i>
                                    <span>Call</span>
                                </button>
                            ` : ''}
                            ${merchant.whatsappBusiness ? `
                                <button onclick="window.open('${Utils.generateWhatsAppUrl(merchant.whatsappBusiness)}')" 
                                        class="text-green-600 hover:text-green-700 text-sm flex items-center space-x-1">
                                    <i class="fab fa-whatsapp"></i>
                                    <span>WhatsApp</span>
                                </button>
                            ` : ''}
                            <button onclick="activityManager.showAddActivityForm('${merchant.id}')" 
                                    class="text-purple-600 hover:text-purple-700 text-sm flex items-center space-x-1">
                                <i class="fas fa-plus"></i>
                                <span>Follow up</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    showAddActivityForm(merchantId = '') {
        const merchants = this.getMerchantsForCurrentUser();
        
        const modalId = Utils.createModal(
            'Log New Activity',
            this.renderActivityForm(null, merchantId, merchants),
            [
                {
                    text: 'Save Activity',
                    onclick: `activityManager.saveActivity('${modalId}')`,
                    class: 'bg-blue-500 text-white'
                }
            ]
        );
    }

    showQuickActivityForm(activityType) {
        const merchants = this.getMerchantsForCurrentUser();
        
        const modalId = Utils.createModal(
            `Log ${activityType} Activity`,
            this.renderQuickActivityForm(activityType, merchants),
            [
                {
                    text: 'Save Activity',
                    onclick: `activityManager.saveQuickActivity('${modalId}', '${activityType}')`,
                    class: 'bg-blue-500 text-white'
                }
            ]
        );
    }

    renderActivityForm(activity = null, selectedMerchantId = '', merchants = []) {
        const isEdit = !!activity;
        
        return `
            <form id="activityForm" class="space-y-4">
                <!-- Merchant Selection -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Merchant *</label>
                    <select name="merchantId" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select a merchant</option>
                        ${merchants.map(merchant => 
                            `<option value="${merchant.id}" ${(activity?.merchantId === merchant.id || selectedMerchantId === merchant.id) ? 'selected' : ''}>
                                ${merchant.merchantName} (${merchant.city})
                            </option>`
                        ).join('')}
                    </select>
                </div>

                <!-- Activity Type -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Activity Type *</label>
                    <select name="type" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select type</option>
                        ${['Call', 'Meeting', 'WhatsApp', 'Email', 'Training', 'Other'].map(type => 
                            `<option value="${type}" ${activity?.type === type ? 'selected' : ''}>${type}</option>`
                        ).join('')}
                    </select>
                </div>

                <!-- Date and Time -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                        <input type="date" name="occurredDate" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value="${activity ? new Date(activity.occurredAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                        <input type="time" name="occurredTime" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value="${activity ? new Date(activity.occurredAt).toTimeString().substr(0, 5) : new Date().toTimeString().substr(0, 5)}" />
                    </div>
                </div>

                <!-- Summary -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Summary *</label>
                    <textarea name="summary" rows="4" required
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Describe what happened during this interaction...">${activity ? activity.summary : ''}</textarea>
                </div>

                <!-- Attachment URL -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Attachment URL</label>
                    <input type="url" name="attachmentUrl"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="https://example.com/file.pdf"
                           value="${activity ? activity.attachmentUrl || '' : ''}" />
                </div>
            </form>
        `;
    }

    renderQuickActivityForm(activityType, merchants) {
        const typeTemplates = {
            'Call': 'Called merchant to discuss...',
            'Meeting': 'Met with merchant at their location to...',
            'WhatsApp': 'Sent WhatsApp message regarding...',
            'Email': 'Sent email to merchant about...',
            'Training': 'Conducted training session on...',
            'Other': 'Other interaction with merchant...'
        };

        return `
            <form id="quickActivityForm" class="space-y-4">
                <!-- Merchant Selection -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Merchant *</label>
                    <select name="merchantId" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select a merchant</option>
                        ${merchants.map(merchant => 
                            `<option value="${merchant.id}">
                                ${merchant.merchantName} (${merchant.city})
                            </option>`
                        ).join('')}
                    </select>
                </div>

                <!-- Summary -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">What happened? *</label>
                    <textarea name="summary" rows="3" required
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="${typeTemplates[activityType]}">${typeTemplates[activityType]}</textarea>
                </div>

                <!-- Quick Date Selection -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">When did this happen?</label>
                    <div class="grid grid-cols-3 gap-2">
                        <button type="button" onclick="activityManager.setQuickDate('now')" 
                                class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                            Just now
                        </button>
                        <button type="button" onclick="activityManager.setQuickDate('hour')" 
                                class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                            1 hour ago
                        </button>
                        <button type="button" onclick="activityManager.setQuickDate('today')" 
                                class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                            Earlier today
                        </button>
                    </div>
                </div>

                <!-- Hidden datetime field -->
                <input type="hidden" name="occurredAt" value="${new Date().toISOString()}" />
            </form>
        `;
    }

    setQuickDate(option) {
        const input = document.querySelector('input[name="occurredAt"]');
        const now = new Date();
        
        switch (option) {
            case 'now':
                input.value = now.toISOString();
                break;
            case 'hour':
                input.value = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
                break;
            case 'today':
                // Set to 2 hours ago as a reasonable "earlier today"
                input.value = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
                break;
        }

        // Update button states
        document.querySelectorAll('[onclick*="setQuickDate"]').forEach(btn => {
            btn.classList.remove('bg-blue-100', 'border-blue-300', 'text-blue-700');
            btn.classList.add('border-gray-300');
        });
        
        event.target.classList.remove('border-gray-300');
        event.target.classList.add('bg-blue-100', 'border-blue-300', 'text-blue-700');
    }

    saveActivity(modalId) {
        const form = document.getElementById('activityForm');
        const validation = Utils.validateForm(form);
        
        if (!validation.isValid) {
            Utils.showNotification('Please fix the validation errors', 'error');
            return;
        }

        const formData = new FormData(form);
        const currentUser = window.auth.getCurrentUser();
        
        // Combine date and time
        const date = formData.get('occurredDate');
        const time = formData.get('occurredTime');
        const occurredAt = new Date(`${date}T${time}`);

        const activityData = {
            id: Utils.generateId('activity'),
            merchantId: formData.get('merchantId'),
            repId: currentUser.id,
            type: formData.get('type'),
            summary: formData.get('summary'),
            occurredAt: occurredAt,
            attachmentUrl: formData.get('attachmentUrl') || null
        };

        window.dataStore.addItem('activities', activityData);
        Utils.showNotification('Activity logged successfully', 'success');
        
        Utils.closeModal(modalId);
        this.loadActivityData();
        this.loadActivityOverview();
    }

    saveQuickActivity(modalId, activityType) {
        const form = document.getElementById('quickActivityForm');
        const validation = Utils.validateForm(form);
        
        if (!validation.isValid) {
            Utils.showNotification('Please select a merchant and add a summary', 'error');
            return;
        }

        const formData = new FormData(form);
        const currentUser = window.auth.getCurrentUser();

        const activityData = {
            id: Utils.generateId('activity'),
            merchantId: formData.get('merchantId'),
            repId: currentUser.id,
            type: activityType,
            summary: formData.get('summary'),
            occurredAt: new Date(formData.get('occurredAt')),
            attachmentUrl: null
        };

        window.dataStore.addItem('activities', activityData);
        Utils.showNotification(`${activityType} activity logged successfully`, 'success');
        
        Utils.closeModal(modalId);
        this.loadActivityData();
        this.loadActivityOverview();
    }

    editActivity(activityId) {
        const activity = window.dataStore.findItem('activities', activityId);
        if (!activity) return;

        const merchants = this.getMerchantsForCurrentUser();
        
        const modalId = Utils.createModal(
            'Edit Activity',
            this.renderActivityForm(activity, '', merchants),
            [
                {
                    text: 'Update Activity',
                    onclick: `activityManager.updateActivity('${activityId}', '${modalId}')`,
                    class: 'bg-blue-500 text-white'
                }
            ]
        );
    }

    updateActivity(activityId, modalId) {
        const form = document.getElementById('activityForm');
        const validation = Utils.validateForm(form);
        
        if (!validation.isValid) {
            Utils.showNotification('Please fix the validation errors', 'error');
            return;
        }

        const formData = new FormData(form);
        
        // Combine date and time
        const date = formData.get('occurredDate');
        const time = formData.get('occurredTime');
        const occurredAt = new Date(`${date}T${time}`);

        const updates = {
            merchantId: formData.get('merchantId'),
            type: formData.get('type'),
            summary: formData.get('summary'),
            occurredAt: occurredAt,
            attachmentUrl: formData.get('attachmentUrl') || null
        };

        window.dataStore.updateItem('activities', activityId, updates);
        Utils.showNotification('Activity updated successfully', 'success');
        
        Utils.closeModal(modalId);
        this.loadActivityData();
    }

    deleteActivity(activityId) {
        if (!confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
            return;
        }

        window.dataStore.deleteItem('activities', activityId);
        Utils.showNotification('Activity deleted successfully', 'success');
        
        this.loadActivityData();
        this.loadActivityOverview();
    }

    clearFilters() {
        this.selectedMerchant = '';
        this.selectedType = '';
        this.selectedDateRange = '30_days';

        // Reset form elements
        document.getElementById('activityMerchantFilter').value = '';
        document.getElementById('activityTypeFilter').value = '';
        document.getElementById('activityDateFilter').value = '30_days';

        this.loadActivityData();
        this.loadActivityOverview();
    }

    exportActivities() {
        const activities = this.getActivitiesForDateRange(this.selectedDateRange);
        const merchants = window.dataStore.getData('merchants');
        
        const exportData = activities.map(activity => {
            const merchant = merchants.find(m => m.id === activity.merchantId);
            
            return {
                'Date': Utils.formatDate(activity.occurredAt),
                'Time': Utils.formatDate(activity.occurredAt, 'time'),
                'Rep Name': this.getRepName(activity.repId),
                'Merchant Name': merchant ? merchant.merchantName : 'Unknown',
                'Merchant Category': merchant ? merchant.category : 'Unknown',
                'Merchant City': merchant ? merchant.city : 'Unknown',
                'Activity Type': activity.type,
                'Summary': activity.summary,
                'Has Attachment': activity.attachmentUrl ? 'Yes' : 'No',
                'Attachment URL': activity.attachmentUrl || ''
            };
        });

        const filename = `activities-${this.selectedDateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        Utils.exportToCSV(exportData, filename);
        Utils.showNotification('Activities exported successfully', 'success');
    }

    getActivitiesForDateRange(dateRange) {
        const currentUser = window.auth.getCurrentUser();
        let allActivities = window.dataStore.getData('activities');
        
        // Filter by user role
        if (currentUser.role === 'Rep') {
            allActivities = allActivities.filter(a => a.repId === currentUser.id);
        }
        
        const now = new Date();
        
        return allActivities.filter(activity => {
            const activityDate = new Date(activity.occurredAt);
            
            switch (dateRange) {
                case '7_days':
                    return activityDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                case '30_days':
                    return activityDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                case '90_days':
                    return activityDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                case 'this_month':
                    return activityDate.getMonth() === now.getMonth() && 
                           activityDate.getFullYear() === now.getFullYear();
                case 'last_month':
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    return activityDate.getMonth() === lastMonth.getMonth() && 
                           activityDate.getFullYear() === lastMonth.getFullYear();
                case 'all_time':
                default:
                    return true;
            }
        });
    }

    getMerchantsForCurrentUser() {
        const currentUser = window.auth.getCurrentUser();
        return window.dataStore.getMerchantsForUser(currentUser.id, currentUser.role);
    }

    getMerchantOptions() {
        const merchants = this.getMerchantsForCurrentUser();
        return merchants.map(merchant => 
            `<option value="${merchant.id}">${merchant.merchantName} (${merchant.city})</option>`
        ).join('');
    }

    getDateRangeDisplayName() {
        const rangeNames = {
            '7_days': 'Last 7 Days',
            '30_days': 'Last 30 Days',
            '90_days': 'Last 90 Days',
            'this_month': 'This Month',
            'last_month': 'Last Month',
            'all_time': 'All Time'
        };
        return rangeNames[this.selectedDateRange] || 'Last 30 Days';
    }

    getRepName(repId) {
        const repNames = {
            'admin-001': 'Admin User',
            'rep-001': 'Sami Al-Ahmad',
            'rep-002': 'Layla Hassan'
        };
        return repNames[repId] || 'Unknown Rep';
    }
}

// Initialize activity manager
window.activityManager = new ActivityManager();