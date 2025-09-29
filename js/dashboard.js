// Dashboard Management System
class DashboardManager {
    constructor() {
        this.selectedPeriod = 'current_month';
        this.chartInstances = {};
    }

    render() {
        const section = document.getElementById('dashboardSection');
        const currentUser = window.auth.getCurrentUser();
        
        section.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p class="text-gray-600">
                            Welcome back, ${currentUser.name}! 
                            ${currentUser.role === 'Admin' ? 'Here\'s your business overview.' : 'Here\'s your performance summary.'}
                        </p>
                    </div>
                    <div class="flex space-x-3">
                        <select id="dashboardPeriodFilter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="current_week">This Week</option>
                            <option value="current_month" selected>This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="current_quarter">This Quarter</option>
                            <option value="current_year">This Year</option>
                        </select>
                        <button onclick="dashboardManager.refreshDashboard()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                            <i class="fas fa-sync-alt"></i>
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                <!-- Key Metrics -->
                <div id="keyMetrics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Metrics will be loaded here -->
                </div>

                ${currentUser.role === 'Admin' ? this.renderManagerDashboard() : this.renderRepDashboard()}

                <!-- Data Health Check -->
                <div id="dataHealthSection" class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-900 flex items-center">
                            <i class="fas fa-heartbeat text-red-500 mr-2"></i>
                            Data Health Check
                        </h2>
                    </div>
                    <div id="dataHealthContent" class="p-6">
                        <!-- Data health content will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadDashboardData();
    }

    renderManagerDashboard() {
        return `
            <!-- Sales Pipeline Overview -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Pipeline Funnel Chart -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-900">Pipeline Funnel</h2>
                    </div>
                    <div class="p-6">
                        <canvas id="pipelineFunnelChart" width="400" height="300"></canvas>
                    </div>
                </div>

                <!-- Conversion Rates -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-900">Conversion Rates</h2>
                    </div>
                    <div class="p-6">
                        <canvas id="conversionChart" width="400" height="300"></canvas>
                    </div>
                </div>
            </div>

            <!-- Performance Analytics -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Rep Performance -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-900">Rep Performance</h2>
                    </div>
                    <div id="repPerformance" class="p-6">
                        <!-- Rep performance will be loaded here -->
                    </div>
                </div>

                <!-- Category Performance -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-900">Category Breakdown</h2>
                    </div>
                    <div class="p-6">
                        <canvas id="categoryChart" width="300" height="300"></canvas>
                    </div>
                </div>

                <!-- Recent Activities -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-900">Recent Activities</h2>
                    </div>
                    <div id="recentActivities" class="p-6">
                        <!-- Recent activities will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Onboarding Progress -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-900">Onboarding Progress</h2>
                </div>
                <div class="p-6">
                    <canvas id="onboardingChart" width="800" height="300"></canvas>
                </div>
            </div>

            <!-- Payout Summary -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-900">Payout Summary</h2>
                </div>
                <div id="payoutSummary" class="p-6">
                    <!-- Payout summary will be loaded here -->
                </div>
            </div>
        `;
    }

    renderRepDashboard() {
        return `
            <!-- My Performance -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- My Pipeline -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-900">My Pipeline</h2>
                    </div>
                    <div class="p-6">
                        <canvas id="myPipelineChart" width="400" height="300"></canvas>
                    </div>
                </div>

                <!-- My Activities -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-900">Activity Breakdown</h2>
                    </div>
                    <div class="p-6">
                        <canvas id="myActivitiesChart" width="400" height="300"></canvas>
                    </div>
                </div>
            </div>

            <!-- My Merchants & Targets -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- My Top Merchants -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-900">My Merchants</h2>
                    </div>
                    <div id="myMerchants" class="p-6">
                        <!-- My merchants will be loaded here -->
                    </div>
                </div>

                <!-- My Earnings -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-900">My Earnings</h2>
                    </div>
                    <div id="myEarnings" class="p-6">
                        <!-- Earnings will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button onclick="merchantManager.showAddMerchantForm()" 
                                class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                            <div class="text-center">
                                <i class="fas fa-plus text-gray-400 text-2xl mb-2"></i>
                                <div class="text-sm font-medium text-gray-600">Add Merchant</div>
                            </div>
                        </button>
                        <button onclick="activityManager.showAddActivityForm()" 
                                class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors">
                            <div class="text-center">
                                <i class="fas fa-history text-gray-400 text-2xl mb-2"></i>
                                <div class="text-sm font-medium text-gray-600">Log Activity</div>
                            </div>
                        </button>
                        <button onclick="window.app.showSection('pipeline')" 
                                class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
                            <div class="text-center">
                                <i class="fas fa-funnel-dollar text-gray-400 text-2xl mb-2"></i>
                                <div class="text-sm font-medium text-gray-600">Pipeline</div>
                            </div>
                        </button>
                        <button onclick="window.app.showSection('onboarding')" 
                                class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                            <div class="text-center">
                                <i class="fas fa-tasks text-gray-400 text-2xl mb-2"></i>
                                <div class="text-sm font-medium text-gray-600">Onboarding</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const periodFilter = document.getElementById('dashboardPeriodFilter');
        
        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.selectedPeriod = e.target.value;
                this.loadDashboardData();
            });
        }
    }

    loadDashboardData() {
        const currentUser = window.auth.getCurrentUser();
        
        this.loadKeyMetrics();
        this.loadDataHealth();
        
        if (currentUser.role === 'Admin') {
            this.loadManagerDashboard();
        } else {
            this.loadRepDashboard();
        }
    }

    loadKeyMetrics() {
        const currentUser = window.auth.getCurrentUser();
        const metrics = this.calculateKeyMetrics(currentUser);
        
        const container = document.getElementById('keyMetrics');
        
        if (currentUser.role === 'Admin') {
            container.innerHTML = `
                <!-- Total Merchants -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-store text-blue-600"></i>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Total Merchants</dt>
                                <dd class="flex items-baseline">
                                    <div class="text-2xl font-semibold text-gray-900">${metrics.totalMerchants}</div>
                                    <div class="ml-2 flex items-baseline text-sm font-semibold ${metrics.merchantsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">
                                        <i class="fas fa-arrow-${metrics.merchantsGrowth >= 0 ? 'up' : 'down'} mr-1"></i>
                                        ${Math.abs(metrics.merchantsGrowth)}%
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <!-- Live Merchants -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-rocket text-green-600"></i>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Live Merchants</dt>
                                <dd class="flex items-baseline">
                                    <div class="text-2xl font-semibold text-gray-900">${metrics.liveMerchants}</div>
                                    <div class="ml-2 text-sm text-gray-600">
                                        ${metrics.totalMerchants > 0 ? Math.round((metrics.liveMerchants / metrics.totalMerchants) * 100) : 0}%
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <!-- Conversion Rate -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-chart-line text-purple-600"></i>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                                <dd class="flex items-baseline">
                                    <div class="text-2xl font-semibold text-gray-900">${metrics.conversionRate}%</div>
                                    <div class="ml-2 text-sm text-gray-600">Won/Total</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <!-- Total Payouts -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-dollar-sign text-yellow-600"></i>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Total Payouts</dt>
                                <dd class="flex items-baseline">
                                    <div class="text-2xl font-semibold text-gray-900">${Utils.formatCurrency(metrics.totalPayouts)}</div>
                                    <div class="ml-2 text-sm text-gray-600">${this.getPeriodDisplayName()}</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Rep metrics
            container.innerHTML = `
                <!-- My Merchants -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-store text-blue-600"></i>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">My Merchants</dt>
                                <dd class="text-2xl font-semibold text-gray-900">${metrics.myMerchants}</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <!-- Won This Period -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-trophy text-green-600"></i>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Won ${this.getPeriodDisplayName()}</dt>
                                <dd class="text-2xl font-semibold text-gray-900">${metrics.wonThisPeriod}</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <!-- My Activities -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-history text-purple-600"></i>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Activities ${this.getPeriodDisplayName()}</dt>
                                <dd class="text-2xl font-semibold text-gray-900">${metrics.activitiesThisPeriod}</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <!-- My Earnings -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-dollar-sign text-yellow-600"></i>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">My Earnings</dt>
                                <dd class="text-2xl font-semibold text-gray-900">${Utils.formatCurrency(metrics.myEarnings)}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    calculateKeyMetrics(currentUser) {
        const merchants = window.dataStore.getMerchantsForUser(currentUser.id, currentUser.role);
        const pipelines = window.dataStore.getData('pipeline');
        const payouts = window.dataStore.getData('payouts');
        const activities = window.dataStore.getData('activities');

        if (currentUser.role === 'Admin') {
            const liveMerchants = merchants.filter(m => m.isLive).length;
            const wonPipelines = pipelines.filter(p => p.isCurrent && p.stage === 'Won').length;
            const activePipelines = pipelines.filter(p => p.isCurrent && p.stage !== 'Rejected').length;
            
            const periodPayouts = this.getPayoutsForPeriod(payouts, this.selectedPeriod);
            const totalPayouts = periodPayouts.reduce((sum, p) => sum + p.amountJod, 0);
            
            return {
                totalMerchants: merchants.length,
                liveMerchants,
                conversionRate: activePipelines > 0 ? Math.round((wonPipelines / activePipelines) * 100) : 0,
                totalPayouts,
                merchantsGrowth: 12 // Simplified growth calculation
            };
        } else {
            // Rep metrics
            const myMerchants = merchants.length;
            const periodPayouts = this.getPayoutsForPeriod(payouts.filter(p => p.repId === currentUser.id), this.selectedPeriod);
            const myEarnings = periodPayouts.reduce((sum, p) => sum + p.amountJod, 0);
            
            const wonThisPeriod = this.getWonInPeriod(pipelines.filter(p => p.responsibleRepId === currentUser.id), this.selectedPeriod);
            const activitiesThisPeriod = this.getActivitiesInPeriod(activities.filter(a => a.repId === currentUser.id), this.selectedPeriod);
            
            return {
                myMerchants,
                wonThisPeriod,
                activitiesThisPeriod,
                myEarnings
            };
        }
    }

    loadManagerDashboard() {
        this.loadPipelineFunnelChart();
        this.loadConversionChart();
        this.loadRepPerformance();
        this.loadCategoryChart();
        this.loadRecentActivities();
        this.loadOnboardingChart();
        this.loadPayoutSummary();
    }

    loadRepDashboard() {
        this.loadMyPipelineChart();
        this.loadMyActivitiesChart();
        this.loadMyMerchants();
        this.loadMyEarnings();
    }

    loadPipelineFunnelChart() {
        const pipelines = window.dataStore.getData('pipeline');
        const currentPipelines = pipelines.filter(p => p.isCurrent);
        
        const stageData = {
            'PendingFirstVisit': currentPipelines.filter(p => p.stage === 'PendingFirstVisit').length,
            'FollowUpNeeded': currentPipelines.filter(p => p.stage === 'FollowUpNeeded').length,
            'ContractSent': currentPipelines.filter(p => p.stage === 'ContractSent').length,
            'Won': currentPipelines.filter(p => p.stage === 'Won').length
        };

        const ctx = document.getElementById('pipelineFunnelChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.chartInstances.pipelineFunnel) {
            this.chartInstances.pipelineFunnel.destroy();
        }

        this.chartInstances.pipelineFunnel = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Pending Visit', 'Follow-up', 'Contract Sent', 'Won'],
                datasets: [{
                    label: 'Merchants',
                    data: Object.values(stageData),
                    backgroundColor: [
                        '#fbbf24', // yellow
                        '#f97316', // orange
                        '#3b82f6', // blue
                        '#10b981'  // green
                    ],
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    loadConversionChart() {
        const pipelines = window.dataStore.getData('pipeline');
        const currentPipelines = pipelines.filter(p => p.isCurrent);
        
        const total = currentPipelines.length;
        const won = currentPipelines.filter(p => p.stage === 'Won').length;
        const rejected = currentPipelines.filter(p => p.stage === 'Rejected').length;
        const active = total - rejected;

        const ctx = document.getElementById('conversionChart');
        if (!ctx) return;

        if (this.chartInstances.conversion) {
            this.chartInstances.conversion.destroy();
        }

        this.chartInstances.conversion = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Won', 'Active Pipeline', 'Rejected'],
                datasets: [{
                    data: [won, active - won, rejected],
                    backgroundColor: [
                        '#10b981', // green
                        '#3b82f6', // blue
                        '#ef4444'  // red
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    loadRepPerformance() {
        const currentUser = window.auth.getCurrentUser();
        const merchants = window.dataStore.getMerchantsForUser(currentUser.id, currentUser.role);
        const pipelines = window.dataStore.getData('pipeline');
        const payouts = this.getPayoutsForPeriod(window.dataStore.getData('payouts'), this.selectedPeriod);

        const repStats = [
            { id: 'rep-001', name: 'Sami Al-Ahmad' },
            { id: 'rep-002', name: 'Layla Hassan' }
        ].map(rep => {
            const repMerchants = merchants.filter(m => {
                const pipeline = pipelines.find(p => p.merchantId === m.id && p.isCurrent);
                return m.createdBy === rep.id || (pipeline && pipeline.responsibleRepId === rep.id);
            });

            const repWon = pipelines.filter(p => p.isCurrent && p.stage === 'Won' && p.responsibleRepId === rep.id).length;
            const repPayouts = payouts.filter(p => p.repId === rep.id);
            const repEarnings = repPayouts.reduce((sum, p) => sum + p.amountJod, 0);

            return {
                ...rep,
                merchants: repMerchants.length,
                won: repWon,
                earnings: repEarnings,
                conversionRate: repMerchants.length > 0 ? Math.round((repWon / repMerchants.length) * 100) : 0
            };
        });

        const container = document.getElementById('repPerformance');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                ${repStats.map(rep => `
                    <div class="border rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <div class="font-medium text-gray-900">${rep.name}</div>
                            <div class="text-sm font-medium text-green-600">${Utils.formatCurrency(rep.earnings)}</div>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-sm">
                            <div class="text-center">
                                <div class="font-semibold text-gray-900">${rep.merchants}</div>
                                <div class="text-gray-600">Merchants</div>
                            </div>
                            <div class="text-center">
                                <div class="font-semibold text-gray-900">${rep.won}</div>
                                <div class="text-gray-600">Won</div>
                            </div>
                            <div class="text-center">
                                <div class="font-semibold text-gray-900">${rep.conversionRate}%</div>
                                <div class="text-gray-600">Rate</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    loadCategoryChart() {
        const currentUser = window.auth.getCurrentUser();
        const merchants = window.dataStore.getMerchantsForUser(currentUser.id, currentUser.role);
        
        const categoryData = {};
        merchants.forEach(merchant => {
            categoryData[merchant.category] = (categoryData[merchant.category] || 0) + 1;
        });

        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        if (this.chartInstances.category) {
            this.chartInstances.category.destroy();
        }

        this.chartInstances.category = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
                        '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            fontSize: 10
                        }
                    }
                }
            }
        });
    }

    loadRecentActivities() {
        const activities = window.dataStore.getData('activities');
        const merchants = window.dataStore.getData('merchants');
        
        const recentActivities = activities
            .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
            .slice(0, 5);

        const container = document.getElementById('recentActivities');
        if (!container) return;

        if (recentActivities.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    <i class="fas fa-history text-2xl mb-2"></i>
                    <p class="text-sm">No recent activities</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="space-y-3">
                ${recentActivities.map(activity => {
                    const merchant = merchants.find(m => m.id === activity.merchantId);
                    return `
                        <div class="flex items-start space-x-3">
                            <div class="flex-shrink-0">
                                <i class="${Utils.getActivityIcon(activity.type)} text-gray-400"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-medium text-gray-900">
                                    ${activity.type} - ${merchant ? merchant.merchantName : 'Unknown'}
                                </div>
                                <div class="text-xs text-gray-500">
                                    ${Utils.timeAgo(activity.occurredAt)}
                                </div>
                                <div class="text-sm text-gray-600 mt-1">
                                    ${Utils.truncateText(activity.summary, 60)}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    loadOnboardingChart() {
        const onboardings = window.dataStore.getData('onboarding');
        
        const stepData = {
            'Survey': onboardings.filter(o => o.surveyFilled).length,
            'Staff Setup': onboardings.filter(o => o.teenStaffInstalled).length,
            'Training': onboardings.filter(o => o.trainingDone).length,
            'Offers': onboardings.filter(o => o.offersAdded && o.offersCount >= 1).length,
            'Assets': onboardings.filter(o => o.assetsComplete).length,
            'Live': onboardings.filter(o => o.live).length
        };

        const ctx = document.getElementById('onboardingChart');
        if (!ctx) return;

        if (this.chartInstances.onboarding) {
            this.chartInstances.onboarding.destroy();
        }

        this.chartInstances.onboarding = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(stepData),
                datasets: [{
                    label: 'Completed',
                    data: Object.values(stepData),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    loadPayoutSummary() {
        const payouts = this.getPayoutsForPeriod(window.dataStore.getData('payouts'), this.selectedPeriod);
        
        const wonBonuses = payouts.filter(p => p.reason === 'WonBonus');
        const liveBonuses = payouts.filter(p => p.reason === 'FullyOnboardedBonus');
        
        const totalAmount = payouts.reduce((sum, p) => sum + p.amountJod, 0);
        const wonAmount = wonBonuses.reduce((sum, p) => sum + p.amountJod, 0);
        const liveAmount = liveBonuses.reduce((sum, p) => sum + p.amountJod, 0);

        const container = document.getElementById('payoutSummary');
        if (!container) return;

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">${Utils.formatCurrency(wonAmount)}</div>
                    <div class="text-sm text-gray-600">Won Bonuses</div>
                    <div class="text-xs text-gray-500">${wonBonuses.length} payouts</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">${Utils.formatCurrency(liveAmount)}</div>
                    <div class="text-sm text-gray-600">Live Bonuses</div>
                    <div class="text-xs text-gray-500">${liveBonuses.length} payouts</div>
                </div>
                <div class="text-center p-4 bg-gray-50 rounded-lg">
                    <div class="text-2xl font-bold text-gray-900">${Utils.formatCurrency(totalAmount)}</div>
                    <div class="text-sm text-gray-600">Total Payouts</div>
                    <div class="text-xs text-gray-500">${this.getPeriodDisplayName()}</div>
                </div>
            </div>
        `;
    }

    loadMyPipelineChart() {
        const currentUser = window.auth.getCurrentUser();
        const pipelines = window.dataStore.getData('pipeline');
        const myPipelines = pipelines.filter(p => p.isCurrent && p.responsibleRepId === currentUser.id);
        
        const stageData = {
            'PendingFirstVisit': myPipelines.filter(p => p.stage === 'PendingFirstVisit').length,
            'FollowUpNeeded': myPipelines.filter(p => p.stage === 'FollowUpNeeded').length,
            'ContractSent': myPipelines.filter(p => p.stage === 'ContractSent').length,
            'Won': myPipelines.filter(p => p.stage === 'Won').length
        };

        const ctx = document.getElementById('myPipelineChart');
        if (!ctx) return;

        if (this.chartInstances.myPipeline) {
            this.chartInstances.myPipeline.destroy();
        }

        this.chartInstances.myPipeline = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pending Visit', 'Follow-up', 'Contract Sent', 'Won'],
                datasets: [{
                    data: Object.values(stageData),
                    backgroundColor: ['#fbbf24', '#f97316', '#3b82f6', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    loadMyActivitiesChart() {
        const currentUser = window.auth.getCurrentUser();
        const activities = this.getActivitiesInPeriodData(
            window.dataStore.getData('activities').filter(a => a.repId === currentUser.id), 
            this.selectedPeriod
        );
        
        const typeData = {
            'Call': activities.filter(a => a.type === 'Call').length,
            'Meeting': activities.filter(a => a.type === 'Meeting').length,
            'WhatsApp': activities.filter(a => a.type === 'WhatsApp').length,
            'Email': activities.filter(a => a.type === 'Email').length,
            'Training': activities.filter(a => a.type === 'Training').length,
            'Other': activities.filter(a => a.type === 'Other').length
        };

        const ctx = document.getElementById('myActivitiesChart');
        if (!ctx) return;

        if (this.chartInstances.myActivities) {
            this.chartInstances.myActivities.destroy();
        }

        this.chartInstances.myActivities = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(typeData),
                datasets: [{
                    label: 'Activities',
                    data: Object.values(typeData),
                    backgroundColor: '#3b82f6',
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    loadMyMerchants() {
        const currentUser = window.auth.getCurrentUser();
        const merchants = window.dataStore.getMerchantsForUser(currentUser.id, currentUser.role);
        const pipelines = window.dataStore.getData('pipeline');
        
        const myMerchants = merchants.slice(0, 5).map(merchant => {
            const pipeline = pipelines.find(p => p.merchantId === merchant.id && p.isCurrent);
            return { merchant, pipeline };
        });

        const container = document.getElementById('myMerchants');
        if (!container) return;

        if (myMerchants.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    <i class="fas fa-store text-2xl mb-2"></i>
                    <p class="text-sm">No merchants assigned</p>
                    <button onclick="merchantManager.showAddMerchantForm()" 
                            class="mt-2 text-blue-600 hover:text-blue-700 text-sm">
                        Add your first merchant
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="space-y-3">
                ${myMerchants.map(({ merchant, pipeline }) => `
                    <div class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onclick="merchantManager.showMerchantDetails('${merchant.id}')">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="${Utils.getCategoryIcon(merchant.category)} text-blue-600 text-sm"></i>
                            </div>
                            <div>
                                <div class="font-medium text-gray-900 text-sm">${Utils.truncateText(merchant.merchantName, 20)}</div>
                                <div class="text-xs text-gray-600">${merchant.city}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="stage-badge ${Utils.getStageClass(pipeline?.stage || 'PendingFirstVisit')} text-xs">
                                ${pipeline ? Utils.getStageDisplayName(pipeline.stage) : 'New'}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${merchants.length > 5 ? `
                <div class="mt-4 text-center">
                    <button onclick="window.app.showSection('merchants')" 
                            class="text-blue-600 hover:text-blue-700 text-sm">
                        View all ${merchants.length} merchants →
                    </button>
                </div>
            ` : ''}
        `;
    }

    loadMyEarnings() {
        const currentUser = window.auth.getCurrentUser();
        const payouts = this.getPayoutsForPeriod(
            window.dataStore.getData('payouts').filter(p => p.repId === currentUser.id), 
            this.selectedPeriod
        );
        
        const wonBonuses = payouts.filter(p => p.reason === 'WonBonus');
        const liveBonuses = payouts.filter(p => p.reason === 'FullyOnboardedBonus');
        
        const totalEarnings = payouts.reduce((sum, p) => sum + p.amountJod, 0);
        const wonEarnings = wonBonuses.reduce((sum, p) => sum + p.amountJod, 0);
        const liveEarnings = liveBonuses.reduce((sum, p) => sum + p.amountJod, 0);

        const container = document.getElementById('myEarnings');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                <!-- Total Earnings -->
                <div class="text-center p-4 bg-green-50 rounded-lg border">
                    <div class="text-2xl font-bold text-green-600">${Utils.formatCurrency(totalEarnings)}</div>
                    <div class="text-sm text-gray-600">Total Earnings ${this.getPeriodDisplayName()}</div>
                </div>

                <!-- Breakdown -->
                <div class="grid grid-cols-2 gap-3">
                    <div class="text-center p-3 bg-blue-50 rounded">
                        <div class="font-semibold text-blue-600">${Utils.formatCurrency(wonEarnings)}</div>
                        <div class="text-xs text-gray-600">Won Bonuses</div>
                        <div class="text-xs text-gray-500">${wonBonuses.length} × 9 JOD</div>
                    </div>
                    <div class="text-center p-3 bg-green-50 rounded">
                        <div class="font-semibold text-green-600">${Utils.formatCurrency(liveEarnings)}</div>
                        <div class="text-xs text-gray-600">Live Bonuses</div>
                        <div class="text-xs text-gray-500">${liveBonuses.length} × 7 JOD</div>
                    </div>
                </div>

                <!-- Recent Payouts -->
                ${payouts.length > 0 ? `
                    <div>
                        <div class="text-sm font-medium text-gray-700 mb-2">Recent Payouts</div>
                        <div class="space-y-2">
                            ${payouts.slice(0, 3).map(payout => {
                                const merchant = window.dataStore.findItem('merchants', payout.merchantId);
                                return `
                                    <div class="flex justify-between items-center text-sm">
                                        <div>
                                            <div class="font-medium">${merchant ? merchant.merchantName : 'Unknown'}</div>
                                            <div class="text-xs text-gray-500">${Utils.formatDate(payout.createdAt)}</div>
                                        </div>
                                        <div class="font-medium text-green-600">${Utils.formatCurrency(payout.amountJod)}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="text-center py-4 text-gray-500">
                        <i class="fas fa-dollar-sign text-2xl mb-2"></i>
                        <p class="text-sm">No earnings yet</p>
                        <p class="text-xs">Win merchants to earn bonuses!</p>
                    </div>
                `}
            </div>
        `;
    }

    loadDataHealth() {
        const merchants = window.dataStore.getData('merchants');
        const activities = window.dataStore.getData('activities');
        const onboardings = window.dataStore.getData('onboarding');
        
        const issues = [];
        
        // Missing contact information
        const missingContacts = merchants.filter(m => !m.phoneMain && !m.emailMain);
        if (missingContacts.length > 0) {
            issues.push({
                type: 'warning',
                title: 'Missing Contact Information',
                description: `${missingContacts.length} merchants have no phone or email`,
                action: 'Update merchant contact details',
                count: missingContacts.length
            });
        }

        // Stale next actions (overdue by more than 3 days)
        const pipelines = window.dataStore.getData('pipeline').filter(p => p.isCurrent);
        const staleActions = pipelines.filter(p => {
            return p.nextActionDue && new Date(p.nextActionDue) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        });
        if (staleActions.length > 0) {
            issues.push({
                type: 'error',
                title: 'Overdue Actions',
                description: `${staleActions.length} pipeline actions are overdue`,
                action: 'Review and update pipeline actions',
                count: staleActions.length
            });
        }

        // Missing assets in onboarding
        const missingAssets = onboardings.filter(o => !o.live && !o.assetsComplete);
        if (missingAssets.length > 0) {
            issues.push({
                type: 'warning',
                title: 'Missing Assets',
                description: `${missingAssets.length} onboardings missing assets`,
                action: 'Complete merchant assets (logo, description)',
                count: missingAssets.length
            });
        }

        // Low activity merchants (no activity in 7+ days)
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const activeProductionMerchants = merchants.filter(m => !m.isLive); // Not live yet
        const lowActivityMerchants = activeProductionMerchants.filter(merchant => {
            const merchantActivities = activities.filter(a => a.merchantId === merchant.id);
            const lastActivity = merchantActivities.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0];
            return !lastActivity || new Date(lastActivity.occurredAt) < oneWeekAgo;
        });

        if (lowActivityMerchants.length > 0) {
            issues.push({
                type: 'info',
                title: 'Low Activity Merchants',
                description: `${lowActivityMerchants.length} merchants with no recent activity`,
                action: 'Follow up with inactive merchants',
                count: lowActivityMerchants.length
            });
        }

        const container = document.getElementById('dataHealthContent');
        
        if (issues.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">All systems healthy!</h3>
                    <p class="text-gray-600">No data issues detected. Your CRM is running smoothly.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${issues.map(issue => `
                    <div class="border rounded-lg p-4 ${
                        issue.type === 'error' ? 'border-red-200 bg-red-50' :
                        issue.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                        'border-blue-200 bg-blue-50'
                    }">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <i class="fas fa-${
                                    issue.type === 'error' ? 'exclamation-triangle text-red-500' :
                                    issue.type === 'warning' ? 'exclamation-triangle text-yellow-500' :
                                    'info-circle text-blue-500'
                                }"></i>
                            </div>
                            <div class="ml-3 flex-1">
                                <div class="font-medium ${
                                    issue.type === 'error' ? 'text-red-900' :
                                    issue.type === 'warning' ? 'text-yellow-900' :
                                    'text-blue-900'
                                }">${issue.title}</div>
                                <div class="text-sm ${
                                    issue.type === 'error' ? 'text-red-700' :
                                    issue.type === 'warning' ? 'text-yellow-700' :
                                    'text-blue-700'
                                } mt-1">${issue.description}</div>
                                <div class="text-xs ${
                                    issue.type === 'error' ? 'text-red-600' :
                                    issue.type === 'warning' ? 'text-yellow-600' :
                                    'text-blue-600'
                                } mt-2">${issue.action}</div>
                            </div>
                            <div class="flex-shrink-0 ml-3">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    issue.type === 'error' ? 'bg-red-100 text-red-800' :
                                    issue.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                }">${issue.count}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    refreshDashboard() {
        Utils.showNotification('Refreshing dashboard...', 'info');
        
        // Simulate refresh delay
        setTimeout(() => {
            this.loadDashboardData();
            Utils.showNotification('Dashboard refreshed successfully', 'success');
        }, 1000);
    }

    // Helper methods for date filtering
    getPayoutsForPeriod(payouts, period) {
        const now = new Date();
        
        return payouts.filter(payout => {
            const payoutDate = new Date(payout.createdAt);
            
            switch (period) {
                case 'current_week':
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                    return payoutDate >= weekStart;
                case 'current_month':
                    return payoutDate.getMonth() === now.getMonth() && 
                           payoutDate.getFullYear() === now.getFullYear();
                case 'last_month':
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    return payoutDate.getMonth() === lastMonth.getMonth() && 
                           payoutDate.getFullYear() === lastMonth.getFullYear();
                case 'current_quarter':
                    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                    return payoutDate >= quarterStart;
                case 'current_year':
                    return payoutDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    }

    getWonInPeriod(pipelines, period) {
        return this.getItemsInPeriod(
            pipelines.filter(p => p.stage === 'Won'), 
            period, 
            'stageSetAt'
        ).length;
    }

    getActivitiesInPeriod(activities, period) {
        return this.getItemsInPeriod(activities, period, 'occurredAt').length;
    }

    getActivitiesInPeriodData(activities, period) {
        return this.getItemsInPeriod(activities, period, 'occurredAt');
    }

    getItemsInPeriod(items, period, dateField) {
        const now = new Date();
        
        return items.filter(item => {
            const itemDate = new Date(item[dateField]);
            
            switch (period) {
                case 'current_week':
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                    return itemDate >= weekStart;
                case 'current_month':
                    return itemDate.getMonth() === now.getMonth() && 
                           itemDate.getFullYear() === now.getFullYear();
                case 'last_month':
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    return itemDate.getMonth() === lastMonth.getMonth() && 
                           itemDate.getFullYear() === lastMonth.getFullYear();
                case 'current_quarter':
                    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                    return itemDate >= quarterStart;
                case 'current_year':
                    return itemDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    }

    getPeriodDisplayName() {
        const periodNames = {
            'current_week': 'This Week',
            'current_month': 'This Month',
            'last_month': 'Last Month',
            'current_quarter': 'This Quarter',
            'current_year': 'This Year'
        };
        return periodNames[this.selectedPeriod] || 'This Month';
    }
}

// Initialize dashboard manager
window.dashboardManager = new DashboardManager();