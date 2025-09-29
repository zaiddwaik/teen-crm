// Onboarding Management System
class OnboardingManager {
    constructor() {
        this.selectedMerchant = null;
    }

    render() {
        const section = document.getElementById('onboardingSection');
        
        section.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Onboarding</h1>
                        <p class="text-gray-600">Manage merchant onboarding process</p>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="onboardingManager.showOnboardingStats()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                            <i class="fas fa-chart-pie"></i>
                            <span>Statistics</span>
                        </button>
                        <button onclick="onboardingManager.exportOnboardingData()" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2">
                            <i class="fas fa-download"></i>
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                <!-- Onboarding Overview -->
                <div id="onboardingOverview" class="bg-white rounded-lg shadow p-6">
                    <!-- Overview stats will be loaded here -->
                </div>

                <!-- Onboarding Queue -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-lg font-semibold text-gray-900">Onboarding Queue</h2>
                        <div class="flex space-x-3">
                            <select id="onboardingStatusFilter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Status</option>
                                <option value="incomplete">Incomplete</option>
                                <option value="ready">Ready for QA</option>
                                <option value="live">Live</option>
                            </select>
                            <select id="onboardingRepFilter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Reps</option>
                                ${this.getRepOptions()}
                            </select>
                        </div>
                    </div>
                    
                    <div id="onboardingList" class="space-y-4">
                        <!-- Onboarding items will be loaded here -->
                    </div>
                </div>

                <!-- Live Validation Modal (hidden by default) -->
                <div id="liveValidationModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div class="mt-3">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-medium text-gray-900">Go Live Validation</h3>
                                <button onclick="onboardingManager.closeLiveValidation()" class="text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div id="liveValidationContent">
                                <!-- Validation content will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadOnboardingData();
        this.loadOnboardingOverview();
    }

    setupEventListeners() {
        const statusFilter = document.getElementById('onboardingStatusFilter');
        const repFilter = document.getElementById('onboardingRepFilter');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.loadOnboardingData());
        }

        if (repFilter) {
            repFilter.addEventListener('change', () => this.loadOnboardingData());
        }
    }

    loadOnboardingOverview() {
        const currentUser = window.auth.getCurrentUser();
        const onboardings = this.getOnboardingsForUser(currentUser.id, currentUser.role);
        const metrics = this.calculateOnboardingMetrics(onboardings);
        
        const overviewContainer = document.getElementById('onboardingOverview');
        overviewContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Total Onboarding -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-gray-900">${metrics.total}</div>
                    <div class="text-sm text-gray-600">Total Onboarding</div>
                </div>
                
                <!-- Completion Rate -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-blue-600">${metrics.completionRate}%</div>
                    <div class="text-sm text-gray-600">Completion Rate</div>
                    <div class="text-xs text-gray-500">${metrics.completed} completed</div>
                </div>
                
                <!-- Ready for QA -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-yellow-600">${metrics.readyForQa}</div>
                    <div class="text-sm text-gray-600">Ready for QA</div>
                </div>
                
                <!-- Live Merchants -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-green-600">${metrics.live}</div>
                    <div class="text-sm text-gray-600">Live Merchants</div>
                </div>
            </div>

            <!-- Progress Breakdown -->
            <div class="mt-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Onboarding Progress</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <div class="text-2xl font-bold text-blue-600">${metrics.progressBreakdown.surveyFilled}%</div>
                        <div class="text-sm text-gray-600">Survey Filled</div>
                    </div>
                    <div class="text-center p-4 bg-purple-50 rounded-lg">
                        <div class="text-2xl font-bold text-purple-600">${metrics.progressBreakdown.offersAdded}%</div>
                        <div class="text-sm text-gray-600">Offers Added</div>
                    </div>
                    <div class="text-center p-4 bg-orange-50 rounded-lg">
                        <div class="text-2xl font-bold text-orange-600">${metrics.progressBreakdown.assetsComplete}%</div>
                        <div class="text-sm text-gray-600">Assets Complete</div>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <div class="text-2xl font-bold text-green-600">${metrics.progressBreakdown.branchesCovered}%</div>
                        <div class="text-sm text-gray-600">Branches Covered</div>
                    </div>
                </div>
            </div>
        `;
    }

    calculateOnboardingMetrics(onboardings) {
        const total = onboardings.length;
        const live = onboardings.filter(o => o.live).length;
        const readyForQa = onboardings.filter(o => o.readyForQa && !o.live).length;
        const completed = live;

        // Progress breakdown
        const progressBreakdown = {
            surveyFilled: total > 0 ? Math.round((onboardings.filter(o => o.surveyFilled).length / total) * 100) : 0,
            offersAdded: total > 0 ? Math.round((onboardings.filter(o => o.offersAdded).length / total) * 100) : 0,
            assetsComplete: total > 0 ? Math.round((onboardings.filter(o => o.assetsComplete).length / total) * 100) : 0,
            branchesCovered: total > 0 ? Math.round((onboardings.filter(o => o.branchesCovered).length / total) * 100) : 0
        };

        return {
            total,
            live,
            readyForQa,
            completed,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            progressBreakdown
        };
    }

    loadOnboardingData() {
        const currentUser = window.auth.getCurrentUser();
        const onboardings = this.getOnboardingsForUser(currentUser.id, currentUser.role);
        
        // Apply filters
        const statusFilter = document.getElementById('onboardingStatusFilter')?.value;
        const repFilter = document.getElementById('onboardingRepFilter')?.value;
        
        let filteredOnboardings = onboardings.filter(onboarding => {
            const matchesStatus = !statusFilter || this.matchesStatusFilter(onboarding, statusFilter);
            const matchesRep = !repFilter || onboarding.assignedRepId === repFilter;
            return matchesStatus && matchesRep;
        });

        // Sort by urgency and last updated
        filteredOnboardings.sort((a, b) => {
            // Priority: incomplete items first, then by last updated
            const aUrgency = this.getUrgencyScore(a);
            const bUrgency = this.getUrgencyScore(b);
            
            if (aUrgency !== bUrgency) {
                return bUrgency - aUrgency; // Higher urgency first
            }
            
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        this.renderOnboardingList(filteredOnboardings);
    }

    matchesStatusFilter(onboarding, statusFilter) {
        switch (statusFilter) {
            case 'incomplete':
                return !window.dataStore.canGoLive(onboarding) && !onboarding.live;
            case 'ready':
                return onboarding.readyForQa && !onboarding.live;
            case 'live':
                return onboarding.live;
            default:
                return true;
        }
    }

    getUrgencyScore(onboarding) {
        if (onboarding.live) return 0; // Lowest priority - already live
        if (window.dataStore.canGoLive(onboarding)) return 3; // High priority - can go live
        if (onboarding.surveyFilled && onboarding.offersAdded) return 2; // Medium priority - making progress
        return 1; // Low priority - just started
    }

    getOnboardingsForUser(userId, role) {
        const onboardings = window.dataStore.getData('onboarding');
        const merchants = window.dataStore.getData('merchants');
        
        let filteredOnboardings = onboardings;
        
        if (role === 'Rep') {
            // Reps see only their assigned onboardings
            filteredOnboardings = onboardings.filter(o => o.assignedRepId === userId);
        }
        
        // Add merchant data
        return filteredOnboardings.map(onboarding => {
            const merchant = merchants.find(m => m.id === onboarding.merchantId);
            return { ...onboarding, merchant };
        }).filter(o => o.merchant); // Only include if merchant exists
    }

    renderOnboardingList(onboardings) {
        const container = document.getElementById('onboardingList');
        
        if (onboardings.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-tasks text-gray-400 text-4xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No onboarding items found</h3>
                    <p class="text-gray-600">Merchants will appear here after they reach the "Won" stage.</p>
                </div>
            `;
            return;
        }

        const onboardingCards = onboardings.map(onboarding => this.renderOnboardingCard(onboarding)).join('');
        container.innerHTML = onboardingCards;
    }

    renderOnboardingCard(onboarding) {
        const merchant = onboarding.merchant;
        const progress = this.calculateProgress(onboarding);
        const canGoLive = window.dataStore.canGoLive(onboarding);
        const isLive = onboarding.live;
        
        const statusClass = isLive ? 'bg-green-100 text-green-800' : 
                           canGoLive ? 'bg-yellow-100 text-yellow-800' : 
                           'bg-gray-100 text-gray-800';
        
        const statusText = isLive ? 'Live' : 
                          canGoLive ? 'Ready for Live' : 
                          'In Progress';

        return `
            <div class="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                 onclick="onboardingManager.showOnboardingDetails('${onboarding.id}')">
                
                <!-- Header -->
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="${Utils.getCategoryIcon(merchant.category)} text-blue-600 text-lg"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">${merchant.merchantName}</h3>
                            <p class="text-sm text-gray-600">${merchant.category} • ${merchant.city}</p>
                        </div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${statusClass}">
                        ${statusText}
                    </span>
                </div>

                <!-- Progress Bar -->
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-medium text-gray-700">Progress</span>
                        <span class="text-sm text-gray-600">${progress.percentage}% Complete</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${progress.percentage}%"></div>
                    </div>
                </div>

                <!-- Checklist Overview -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-lg ${onboarding.surveyFilled ? 'text-green-600' : 'text-gray-400'}">
                            <i class="fas fa-${onboarding.surveyFilled ? 'check-circle' : 'circle'}"></i>
                        </div>
                        <div class="text-xs text-gray-600 mt-1">Survey</div>
                    </div>
                    <div class="text-center">
                        <div class="text-lg ${onboarding.offersAdded ? 'text-green-600' : 'text-gray-400'}">
                            <i class="fas fa-${onboarding.offersAdded ? 'check-circle' : 'circle'}"></i>
                        </div>
                        <div class="text-xs text-gray-600 mt-1">Offers (${onboarding.offersCount})</div>
                    </div>
                    <div class="text-center">
                        <div class="text-lg ${onboarding.assetsComplete ? 'text-green-600' : 'text-gray-400'}">
                            <i class="fas fa-${onboarding.assetsComplete ? 'check-circle' : 'circle'}"></i>
                        </div>
                        <div class="text-xs text-gray-600 mt-1">Assets</div>
                    </div>
                    <div class="text-center">
                        <div class="text-lg ${onboarding.branchesCovered ? 'text-green-600' : 'text-gray-400'}">
                            <i class="fas fa-${onboarding.branchesCovered ? 'check-circle' : 'circle'}"></i>
                        </div>
                        <div class="text-xs text-gray-600 mt-1">Branches</div>
                    </div>
                </div>

                <!-- Assigned Rep & Last Update -->
                <div class="flex justify-between items-center text-sm text-gray-600">
                    <div>
                        <i class="fas fa-user mr-1"></i>
                        ${this.getRepName(onboarding.assignedRepId)}
                    </div>
                    <div>
                        Updated ${Utils.timeAgo(onboarding.updatedAt)}
                    </div>
                </div>

                ${canGoLive && !isLive ? `
                    <div class="mt-4 pt-4 border-t">
                        <button onclick="event.stopPropagation(); onboardingManager.showLiveValidation('${onboarding.id}')"
                                class="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2">
                            <i class="fas fa-rocket"></i>
                            <span>Go Live</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    calculateProgress(onboarding) {
        const requiredSteps = [
            'surveyFilled',
            'teenStaffInstalled',
            'credentialsSent',
            'trainingDone',
            'offersAdded',
            'branchesCovered',
            'assetsComplete'
        ];

        const completedSteps = requiredSteps.filter(step => {
            if (step === 'offersAdded') {
                return onboarding.offersAdded && onboarding.offersCount >= 1;
            }
            return onboarding[step];
        });

        const percentage = Math.round((completedSteps.length / requiredSteps.length) * 100);
        
        return {
            completed: completedSteps.length,
            total: requiredSteps.length,
            percentage
        };
    }

    showOnboardingDetails(onboardingId) {
        const onboarding = window.dataStore.findItem('onboarding', onboardingId);
        if (!onboarding) return;

        const merchant = window.dataStore.findItem('merchants', onboarding.merchantId);
        if (!merchant) return;

        this.selectedMerchant = { onboarding, merchant };

        const modalId = Utils.createModal(
            `Onboarding - ${merchant.merchantName}`,
            this.renderOnboardingDetailsContent(onboarding, merchant),
            [
                {
                    text: 'Save Changes',
                    onclick: `onboardingManager.saveOnboardingChanges('${onboardingId}', '${modalId}')`,
                    class: 'bg-blue-500 text-white'
                }
            ]
        );
    }

    renderOnboardingDetailsContent(onboarding, merchant) {
        const currentUser = window.auth.getCurrentUser();
        const canEdit = currentUser.role === 'Admin' || onboarding.assignedRepId === currentUser.id;
        const canGoLive = window.dataStore.canGoLive(onboarding);

        return `
            <div class="max-h-96 overflow-y-auto">
                <form id="onboardingForm">
                    <!-- Contact Information -->
                    <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h4 class="font-medium text-gray-900 mb-3">Contact Information</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                                <input type="text" name="contactName" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       value="${onboarding.contactName || ''}" ${!canEdit ? 'readonly' : ''} />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                <input type="tel" name="contactNumber" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       value="${onboarding.contactNumber || ''}" ${!canEdit ? 'readonly' : ''} />
                            </div>
                        </div>
                        <div class="mt-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Location Label</label>
                            <input type="text" name="locationLabel" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   value="${onboarding.locationLabel || ''}" ${!canEdit ? 'readonly' : ''} />
                        </div>
                    </div>

                    <!-- Onboarding Checklist -->
                    <div class="mb-6">
                        <h4 class="font-medium text-gray-900 mb-3">Onboarding Checklist</h4>
                        <div class="space-y-3">
                            ${this.renderChecklistItem('surveyFilled', 'Survey Filled', 'Merchant has completed the initial survey', onboarding.surveyFilled, canEdit)}
                            ${this.renderChecklistItem('teenStaffInstalled', 'Teen Staff App Installed', 'Staff has installed and set up the Teen app', onboarding.teenStaffInstalled, canEdit)}
                            ${this.renderChecklistItem('credentialsSent', 'Credentials Sent', 'Login credentials have been sent to merchant', onboarding.credentialsSent, canEdit)}
                            ${this.renderChecklistItem('trainingDone', 'Training Completed', 'Staff training has been completed', onboarding.trainingDone, canEdit)}
                            
                            <!-- Offers Section -->
                            <div class="p-3 border rounded-lg ${onboarding.offersAdded && onboarding.offersCount >= 1 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <input type="checkbox" name="offersAdded" 
                                               class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                               ${onboarding.offersAdded ? 'checked' : ''} ${!canEdit ? 'disabled' : ''} />
                                        <div>
                                            <div class="font-medium text-gray-900">Offers Added</div>
                                            <div class="text-sm text-gray-600">At least 1 offer has been created</div>
                                        </div>
                                    </div>
                                    <div class="text-sm">
                                        <input type="number" name="offersCount" min="0" 
                                               class="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                               value="${onboarding.offersCount || 0}" ${!canEdit ? 'readonly' : ''} />
                                        <span class="text-gray-600 ml-1">offers</span>
                                    </div>
                                </div>
                            </div>

                            ${this.renderChecklistItem('branchesCovered', 'Branches Covered', 'All merchant branches are configured', onboarding.branchesCovered, canEdit)}
                            ${this.renderChecklistItem('assetsComplete', 'Assets Complete', 'Logo, description, and location assets provided', onboarding.assetsComplete, canEdit)}
                            ${this.renderChecklistItem('readyForQa', 'Ready for QA', 'All requirements met and ready for quality assurance', onboarding.readyForQa, canEdit)}
                        </div>
                    </div>

                    <!-- Live Status -->
                    <div class="mb-6 p-4 ${onboarding.live ? 'bg-green-50' : canGoLive ? 'bg-yellow-50' : 'bg-gray-50'} rounded-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium text-gray-900">Live Status</h4>
                                <p class="text-sm text-gray-600">
                                    ${onboarding.live ? 'Merchant is live and operational' : 
                                      canGoLive ? 'All requirements met - ready to go live' : 
                                      'Requirements not yet met'}
                                </p>
                            </div>
                            <div class="text-right">
                                ${onboarding.live ? `
                                    <span class="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">
                                        <i class="fas fa-check mr-1"></i> Live
                                    </span>
                                    <div class="text-xs text-gray-600 mt-1">
                                        Since ${Utils.formatDate(onboarding.liveDate)}
                                    </div>
                                ` : canGoLive ? `
                                    <button type="button" onclick="onboardingManager.showLiveValidation('${onboarding.id}')"
                                            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                                        <i class="fas fa-rocket mr-1"></i> Go Live
                                    </button>
                                ` : `
                                    <span class="px-3 py-1 bg-gray-400 text-white rounded-full text-sm">
                                        Not Ready
                                    </span>
                                `}
                            </div>
                        </div>
                        
                        ${!canGoLive && !onboarding.live ? `
                            <div class="mt-3 p-3 bg-yellow-100 rounded border-l-4 border-yellow-400">
                                <div class="text-sm text-yellow-800">
                                    <i class="fas fa-exclamation-triangle mr-1"></i>
                                    <strong>Missing Requirements:</strong>
                                    ${this.getMissingRequirements(onboarding).join(', ')}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- QA Notes -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-1">QA Notes</label>
                        <textarea name="qaNotes" rows="3" 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Quality assurance notes and comments..."
                                  ${!canEdit ? 'readonly' : ''}>${onboarding.qaNotes || ''}</textarea>
                    </div>
                </form>

                ${!canEdit ? `
                    <div class="text-center py-4 text-gray-500">
                        <i class="fas fa-lock text-lg mb-2"></i>
                        <p class="text-sm">You don't have permission to edit this onboarding.</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderChecklistItem(name, title, description, checked, canEdit) {
        return `
            <div class="flex items-center space-x-3 p-3 border rounded-lg ${checked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                <input type="checkbox" name="${name}" 
                       class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       ${checked ? 'checked' : ''} ${!canEdit ? 'disabled' : ''} />
                <div class="flex-1">
                    <div class="font-medium text-gray-900">${title}</div>
                    <div class="text-sm text-gray-600">${description}</div>
                </div>
                <div class="text-lg ${checked ? 'text-green-600' : 'text-gray-400'}">
                    <i class="fas fa-${checked ? 'check-circle' : 'circle'}"></i>
                </div>
            </div>
        `;
    }

    getMissingRequirements(onboarding) {
        const requirements = [];
        
        if (!onboarding.surveyFilled) requirements.push('Survey');
        if (!onboarding.offersAdded || onboarding.offersCount < 1) requirements.push('Offers');
        if (!onboarding.branchesCovered) requirements.push('Branches');
        if (!onboarding.assetsComplete) requirements.push('Assets');
        
        return requirements;
    }

    saveOnboardingChanges(onboardingId, modalId) {
        const form = document.getElementById('onboardingForm');
        const formData = new FormData(form);
        
        const updates = {
            contactName: formData.get('contactName'),
            contactNumber: formData.get('contactNumber'),
            locationLabel: formData.get('locationLabel'),
            surveyFilled: formData.get('surveyFilled') === 'on',
            teenStaffInstalled: formData.get('teenStaffInstalled') === 'on',
            credentialsSent: formData.get('credentialsSent') === 'on',
            trainingDone: formData.get('trainingDone') === 'on',
            offersAdded: formData.get('offersAdded') === 'on',
            offersCount: parseInt(formData.get('offersCount')) || 0,
            branchesCovered: formData.get('branchesCovered') === 'on',
            assetsComplete: formData.get('assetsComplete') === 'on',
            readyForQa: formData.get('readyForQa') === 'on',
            qaNotes: formData.get('qaNotes')
        };

        window.dataStore.updateItem('onboarding', onboardingId, updates);
        Utils.showNotification('Onboarding updated successfully', 'success');
        
        Utils.closeModal(modalId);
        this.loadOnboardingData();
        this.loadOnboardingOverview();
    }

    showLiveValidation(onboardingId) {
        const onboarding = window.dataStore.findItem('onboarding', onboardingId);
        const merchant = window.dataStore.findItem('merchants', onboarding.merchantId);
        
        if (!onboarding || !merchant) return;

        const canGoLive = window.dataStore.canGoLive(onboarding);
        const missing = this.getMissingRequirements(onboarding);

        const modal = document.getElementById('liveValidationModal');
        const content = document.getElementById('liveValidationContent');
        
        content.innerHTML = `
            <div class="text-center mb-6">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full ${canGoLive ? 'bg-green-100' : 'bg-red-100'}">
                    <i class="fas fa-${canGoLive ? 'rocket' : 'exclamation-triangle'} ${canGoLive ? 'text-green-600' : 'text-red-600'} text-xl"></i>
                </div>
                <h3 class="mt-2 text-lg font-medium text-gray-900">
                    ${canGoLive ? 'Ready to Go Live!' : 'Cannot Go Live'}
                </h3>
                <p class="mt-1 text-sm text-gray-600">
                    ${merchant.merchantName}
                </p>
            </div>

            ${canGoLive ? `
                <div class="mb-6">
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-check-circle text-green-400"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-green-800">All requirements met</h3>
                                <div class="mt-2 text-sm text-green-700">
                                    <ul class="list-disc pl-5 space-y-1">
                                        <li>Survey completed</li>
                                        <li>At least 1 offer added</li>
                                        <li>All branches covered</li>
                                        <li>Assets complete</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="text-center">
                    <button onclick="onboardingManager.goLive('${onboardingId}')"
                            class="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-medium">
                        <i class="fas fa-rocket mr-2"></i>
                        Confirm Go Live
                    </button>
                </div>
            ` : `
                <div class="mb-6">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-red-400"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-red-800">Missing requirements</h3>
                                <div class="mt-2 text-sm text-red-700">
                                    <ul class="list-disc pl-5 space-y-1">
                                        ${missing.map(req => `<li>${req} not completed</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="text-center">
                    <button onclick="onboardingManager.closeLiveValidation()"
                            class="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400">
                        Close
                    </button>
                </div>
            `}
        `;

        modal.classList.remove('hidden');
    }

    closeLiveValidation() {
        document.getElementById('liveValidationModal').classList.add('hidden');
    }

    goLive(onboardingId) {
        try {
            const onboarding = window.dataStore.findItem('onboarding', onboardingId);
            const merchant = window.dataStore.findItem('merchants', onboarding.merchantId);
            
            // Set merchant live
            window.dataStore.setMerchantLive(onboarding.merchantId);
            
            Utils.showNotification(`${merchant.merchantName} is now live! 🚀`, 'success');
            Utils.showNotification('Live payout of 7 JOD has been created', 'info');
            
            this.closeLiveValidation();
            this.loadOnboardingData();
            this.loadOnboardingOverview();
            
        } catch (error) {
            Utils.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    showOnboardingStats() {
        const currentUser = window.auth.getCurrentUser();
        const onboardings = this.getOnboardingsForUser(currentUser.id, currentUser.role);
        const stats = this.calculateDetailedStats(onboardings);
        
        const modalId = Utils.createModal(
            'Onboarding Statistics',
            this.renderOnboardingStatsContent(stats),
            []
        );
    }

    calculateDetailedStats(onboardings) {
        const total = onboardings.length;
        
        // Completion rates for each step
        const stepCompletion = {
            surveyFilled: onboardings.filter(o => o.surveyFilled).length,
            teenStaffInstalled: onboardings.filter(o => o.teenStaffInstalled).length,
            credentialsSent: onboardings.filter(o => o.credentialsSent).length,
            trainingDone: onboardings.filter(o => o.trainingDone).length,
            offersAdded: onboardings.filter(o => o.offersAdded && o.offersCount >= 1).length,
            branchesCovered: onboardings.filter(o => o.branchesCovered).length,
            assetsComplete: onboardings.filter(o => o.assetsComplete).length,
            live: onboardings.filter(o => o.live).length
        };

        // Average completion time (simplified)
        const avgCompletionDays = 7; // Placeholder

        // Rep performance
        const repStats = this.calculateRepOnboardingStats(onboardings);

        return {
            total,
            stepCompletion,
            avgCompletionDays,
            repStats
        };
    }

    calculateRepOnboardingStats(onboardings) {
        const reps = ['rep-001', 'rep-002'];
        
        return reps.map(repId => {
            const repOnboardings = onboardings.filter(o => o.assignedRepId === repId);
            const liveCount = repOnboardings.filter(o => o.live).length;
            
            return {
                repId,
                name: this.getRepName(repId),
                total: repOnboardings.length,
                live: liveCount,
                completionRate: repOnboardings.length > 0 ? Math.round((liveCount / repOnboardings.length) * 100) : 0
            };
        });
    }

    renderOnboardingStatsContent(stats) {
        return `
            <div class="max-h-96 overflow-y-auto space-y-6">
                <!-- Overall Stats -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-4">Overall Performance</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600">${stats.total}</div>
                            <div class="text-sm text-gray-600">Total Onboardings</div>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <div class="text-2xl font-bold text-green-600">${stats.avgCompletionDays}</div>
                            <div class="text-sm text-gray-600">Avg. Days to Live</div>
                        </div>
                    </div>
                </div>

                <!-- Step Completion -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-4">Step Completion Rates</h4>
                    <div class="space-y-3">
                        ${Object.entries(stats.stepCompletion).map(([step, count]) => {
                            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                            const stepName = step.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                            
                            return `
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span class="text-gray-700">${stepName}</span>
                                    <div class="flex items-center space-x-3">
                                        <div class="w-32 bg-gray-200 rounded-full h-2">
                                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                                        </div>
                                        <span class="text-sm font-medium text-gray-900 w-12 text-right">${percentage}%</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Rep Performance -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-4">Rep Performance</h4>
                    <div class="space-y-3">
                        ${stats.repStats.map(rep => `
                            <div class="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <div class="font-medium text-gray-900">${rep.name}</div>
                                    <div class="text-sm text-gray-600">${rep.total} total onboardings</div>
                                </div>
                                <div class="text-right">
                                    <div class="font-semibold text-gray-900">${rep.live} live</div>
                                    <div class="text-sm text-green-600">${rep.completionRate}% completion</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    exportOnboardingData() {
        const currentUser = window.auth.getCurrentUser();
        const onboardings = this.getOnboardingsForUser(currentUser.id, currentUser.role);
        
        const exportData = onboardings.map(onboarding => {
            const progress = this.calculateProgress(onboarding);
            
            return {
                'Merchant Name': onboarding.merchant.merchantName,
                'Category': onboarding.merchant.category,
                'City': onboarding.merchant.city,
                'Assigned Rep': this.getRepName(onboarding.assignedRepId),
                'Contact Name': onboarding.contactName,
                'Contact Number': onboarding.contactNumber,
                'Progress %': progress.percentage,
                'Survey Filled': onboarding.surveyFilled ? 'Yes' : 'No',
                'Staff Installed': onboarding.teenStaffInstalled ? 'Yes' : 'No',
                'Credentials Sent': onboarding.credentialsSent ? 'Yes' : 'No',
                'Training Done': onboarding.trainingDone ? 'Yes' : 'No',
                'Offers Added': onboarding.offersAdded ? 'Yes' : 'No',
                'Offers Count': onboarding.offersCount,
                'Branches Covered': onboarding.branchesCovered ? 'Yes' : 'No',
                'Assets Complete': onboarding.assetsComplete ? 'Yes' : 'No',
                'Ready for QA': onboarding.readyForQa ? 'Yes' : 'No',
                'Is Live': onboarding.live ? 'Yes' : 'No',
                'Live Date': onboarding.liveDate ? Utils.formatDate(onboarding.liveDate) : 'N/A',
                'Last Updated': Utils.formatDate(onboarding.updatedAt),
                'QA Notes': onboarding.qaNotes
            };
        });

        Utils.exportToCSV(exportData, 'onboarding-export.csv');
        Utils.showNotification('Onboarding data exported successfully', 'success');
    }

    getRepName(repId) {
        const repNames = {
            'admin-001': 'Admin User',
            'rep-001': 'Sami Al-Ahmad',
            'rep-002': 'Layla Hassan'
        };
        return repNames[repId] || 'Unknown Rep';
    }

    getRepOptions() {
        const reps = [
            { id: 'rep-001', name: 'Sami Al-Ahmad' },
            { id: 'rep-002', name: 'Layla Hassan' }
        ];
        return reps.map(rep => `<option value="${rep.id}">${rep.name}</option>`).join('');
    }
}

// Initialize onboarding manager
window.onboardingManager = new OnboardingManager();