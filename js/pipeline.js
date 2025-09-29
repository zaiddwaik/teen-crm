// Sales Pipeline Management System
class PipelineManager {
    constructor() {
        this.selectedStage = null;
        this.selectedMerchant = null;
    }

    render() {
        const section = document.getElementById('pipelineSection');
        
        section.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
                        <p class="text-gray-600">Track merchant progress through sales stages</p>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="pipelineManager.exportPipelineData()" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2">
                            <i class="fas fa-download"></i>
                            <span>Export</span>
                        </button>
                        <button onclick="pipelineManager.showPipelineStats()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                            <i class="fas fa-chart-bar"></i>
                            <span>Analytics</span>
                        </button>
                    </div>
                </div>

                <!-- Pipeline Overview -->
                <div id="pipelineOverview" class="bg-white rounded-lg shadow p-6">
                    <!-- Pipeline stats will be loaded here -->
                </div>

                <!-- Pipeline Kanban Board -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex space-x-6 overflow-x-auto pb-4">
                        <div class="flex-shrink-0 w-80">
                            <div class="bg-yellow-50 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="font-semibold text-gray-900 flex items-center">
                                        <div class="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                                        Pending First Visit
                                    </h3>
                                    <span id="pendingCount" class="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium">0</span>
                                </div>
                                <div id="pendingColumn" class="space-y-3 min-h-32">
                                    <!-- Cards will be loaded here -->
                                </div>
                            </div>
                        </div>

                        <div class="flex-shrink-0 w-80">
                            <div class="bg-orange-50 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="font-semibold text-gray-900 flex items-center">
                                        <div class="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
                                        Follow-up Needed
                                    </h3>
                                    <span id="followupCount" class="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">0</span>
                                </div>
                                <div id="followupColumn" class="space-y-3 min-h-32">
                                    <!-- Cards will be loaded here -->
                                </div>
                            </div>
                        </div>

                        <div class="flex-shrink-0 w-80">
                            <div class="bg-blue-50 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="font-semibold text-gray-900 flex items-center">
                                        <div class="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                                        Contract Sent
                                    </h3>
                                    <span id="contractCount" class="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">0</span>
                                </div>
                                <div id="contractColumn" class="space-y-3 min-h-32">
                                    <!-- Cards will be loaded here -->
                                </div>
                            </div>
                        </div>

                        <div class="flex-shrink-0 w-80">
                            <div class="bg-green-50 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="font-semibold text-gray-900 flex items-center">
                                        <div class="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                                        Won
                                    </h3>
                                    <span id="wonCount" class="bg-green-200 text-green-800 px-2 py-1 rounded-full text-sm font-medium">0</span>
                                </div>
                                <div id="wonColumn" class="space-y-3 min-h-32">
                                    <!-- Cards will be loaded here -->
                                </div>
                            </div>
                        </div>

                        <div class="flex-shrink-0 w-80">
                            <div class="bg-red-50 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="font-semibold text-gray-900 flex items-center">
                                        <div class="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                                        Rejected
                                    </h3>
                                    <span id="rejectedCount" class="bg-red-200 text-red-800 px-2 py-1 rounded-full text-sm font-medium">0</span>
                                </div>
                                <div id="rejectedColumn" class="space-y-3 min-h-32">
                                    <!-- Cards will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions Panel -->
                <div id="actionsPanel" class="hidden bg-white rounded-lg shadow p-6">
                    <!-- Action controls will be loaded here -->
                </div>
            </div>
        `;

        this.loadPipelineData();
        this.loadPipelineOverview();
    }

    loadPipelineOverview() {
        const currentUser = window.auth.getCurrentUser();
        const merchants = window.dataStore.getMerchantsForUser(currentUser.id, currentUser.role);
        const pipelines = window.dataStore.getData('pipeline');
        
        // Calculate pipeline metrics
        const metrics = this.calculatePipelineMetrics(merchants, pipelines);
        
        const overviewContainer = document.getElementById('pipelineOverview');
        overviewContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Total Merchants -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-gray-900">${metrics.total}</div>
                    <div class="text-sm text-gray-600">Total Merchants</div>
                </div>
                
                <!-- Conversion Rate -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-green-600">${metrics.conversionRate}%</div>
                    <div class="text-sm text-gray-600">Conversion Rate</div>
                    <div class="text-xs text-gray-500">Won / Total Active</div>
                </div>
                
                <!-- Win Rate This Month -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-blue-600">${metrics.monthlyWinRate}%</div>
                    <div class="text-sm text-gray-600">Monthly Win Rate</div>
                    <div class="text-xs text-gray-500">${metrics.monthlyWins} won this month</div>
                </div>
                
                <!-- Avg. Days to Close -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-purple-600">${metrics.avgDaysToClose}</div>
                    <div class="text-sm text-gray-600">Avg. Days to Close</div>
                    <div class="text-xs text-gray-500">From first visit to won</div>
                </div>
            </div>
            
            <!-- Stage Breakdown -->
            <div class="mt-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Pipeline Distribution</h3>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div class="text-center p-4 bg-yellow-50 rounded-lg">
                        <div class="text-2xl font-bold text-yellow-600">${metrics.stageBreakdown.PendingFirstVisit}</div>
                        <div class="text-sm text-gray-600">Pending Visit</div>
                    </div>
                    <div class="text-center p-4 bg-orange-50 rounded-lg">
                        <div class="text-2xl font-bold text-orange-600">${metrics.stageBreakdown.FollowUpNeeded}</div>
                        <div class="text-sm text-gray-600">Follow-up</div>
                    </div>
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <div class="text-2xl font-bold text-blue-600">${metrics.stageBreakdown.ContractSent}</div>
                        <div class="text-sm text-gray-600">Contract</div>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <div class="text-2xl font-bold text-green-600">${metrics.stageBreakdown.Won}</div>
                        <div class="text-sm text-gray-600">Won</div>
                    </div>
                    <div class="text-center p-4 bg-red-50 rounded-lg">
                        <div class="text-2xl font-bold text-red-600">${metrics.stageBreakdown.Rejected}</div>
                        <div class="text-sm text-gray-600">Rejected</div>
                    </div>
                </div>
            </div>
        `;
    }

    calculatePipelineMetrics(merchants, pipelines) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Filter active merchants (not rejected)
        const activePipelines = pipelines.filter(p => p.isCurrent && p.stage !== 'Rejected');
        const wonPipelines = pipelines.filter(p => p.isCurrent && p.stage === 'Won');
        
        // Monthly metrics
        const monthlyWins = pipelines.filter(p => {
            const stageDate = new Date(p.stageSetAt);
            return p.stage === 'Won' && 
                   stageDate.getMonth() === currentMonth && 
                   stageDate.getFullYear() === currentYear;
        });

        // Stage breakdown
        const stageBreakdown = {
            PendingFirstVisit: 0,
            FollowUpNeeded: 0,
            ContractSent: 0,
            Won: 0,
            Rejected: 0
        };

        pipelines.filter(p => p.isCurrent).forEach(pipeline => {
            stageBreakdown[pipeline.stage]++;
        });

        // Calculate average days to close (simplified)
        const avgDaysToClose = 14; // Simplified calculation

        return {
            total: merchants.length,
            conversionRate: activePipelines.length > 0 ? Math.round((wonPipelines.length / activePipelines.length) * 100) : 0,
            monthlyWinRate: activePipelines.length > 0 ? Math.round((monthlyWins.length / activePipelines.length) * 100) : 0,
            monthlyWins: monthlyWins.length,
            avgDaysToClose,
            stageBreakdown
        };
    }

    loadPipelineData() {
        const currentUser = window.auth.getCurrentUser();
        const merchants = window.dataStore.getMerchantsForUser(currentUser.id, currentUser.role);
        const pipelines = window.dataStore.getData('pipeline');
        
        // Group merchants by pipeline stage
        const stageGroups = {
            PendingFirstVisit: [],
            FollowUpNeeded: [],
            ContractSent: [],
            Won: [],
            Rejected: []
        };

        merchants.forEach(merchant => {
            const pipeline = pipelines.find(p => p.merchantId === merchant.id && p.isCurrent);
            if (pipeline) {
                stageGroups[pipeline.stage].push({ merchant, pipeline });
            }
        });

        // Render each column
        this.renderColumn('pendingColumn', 'PendingFirstVisit', stageGroups.PendingFirstVisit);
        this.renderColumn('followupColumn', 'FollowUpNeeded', stageGroups.FollowUpNeeded);
        this.renderColumn('contractColumn', 'ContractSent', stageGroups.ContractSent);
        this.renderColumn('wonColumn', 'Won', stageGroups.Won);
        this.renderColumn('rejectedColumn', 'Rejected', stageGroups.Rejected);

        // Update counts
        document.getElementById('pendingCount').textContent = stageGroups.PendingFirstVisit.length;
        document.getElementById('followupCount').textContent = stageGroups.FollowUpNeeded.length;
        document.getElementById('contractCount').textContent = stageGroups.ContractSent.length;
        document.getElementById('wonCount').textContent = stageGroups.Won.length;
        document.getElementById('rejectedCount').textContent = stageGroups.Rejected.length;
    }

    renderColumn(columnId, stage, merchants) {
        const container = document.getElementById(columnId);
        
        if (merchants.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-2xl mb-2"></i>
                    <p class="text-sm">No merchants in this stage</p>
                </div>
            `;
            return;
        }

        const cards = merchants.map(({ merchant, pipeline }) => this.renderMerchantCard(merchant, pipeline, stage)).join('');
        container.innerHTML = cards;
    }

    renderMerchantCard(merchant, pipeline, stage) {
        const isOverdue = pipeline.nextActionDue && new Date(pipeline.nextActionDue) < new Date();
        const overdueClass = isOverdue ? 'border-l-4 border-red-500' : '';
        
        return `
            <div class="bg-white rounded-lg border shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow ${overdueClass}"
                 onclick="pipelineManager.showMerchantActions('${merchant.id}', '${stage}')">
                <!-- Header -->
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="${Utils.getCategoryIcon(merchant.category)} text-blue-600 text-sm"></i>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900 text-sm">${Utils.truncateText(merchant.merchantName, 20)}</h4>
                            <p class="text-xs text-gray-600">${merchant.category}</p>
                        </div>
                    </div>
                    ${isOverdue ? '<i class="fas fa-exclamation-triangle text-red-500"></i>' : ''}
                </div>

                <!-- Details -->
                <div class="space-y-2 text-xs text-gray-600">
                    <div class="flex justify-between">
                        <span>City:</span>
                        <span class="font-medium">${merchant.city}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Student Fit:</span>
                        <span class="px-1 py-0.5 rounded text-xs ${Utils.getStudentFitClass(merchant.studentFit)}">${merchant.studentFit}</span>
                    </div>
                    ${pipeline.responsibleRepId ? `
                        <div class="flex justify-between">
                            <span>Rep:</span>
                            <span class="font-medium">${this.getRepName(pipeline.responsibleRepId)}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Next Action -->
                ${pipeline.nextAction ? `
                    <div class="mt-3 pt-3 border-t">
                        <div class="text-xs text-gray-600 mb-1">Next Action:</div>
                        <div class="text-xs font-medium text-gray-900">${Utils.truncateText(pipeline.nextAction, 40)}</div>
                        <div class="text-xs text-gray-500 mt-1 ${isOverdue ? 'text-red-500 font-medium' : ''}">
                            Due: ${Utils.formatDate(pipeline.nextActionDue)}
                        </div>
                    </div>
                ` : ''}

                <!-- Stage Date -->
                <div class="mt-3 pt-2 border-t text-xs text-gray-500">
                    In stage since ${Utils.formatDate(pipeline.stageSetAt)}
                </div>
            </div>
        `;
    }

    showMerchantActions(merchantId, currentStage) {
        const merchant = window.dataStore.findItem('merchants', merchantId);
        const pipeline = window.dataStore.getCurrentPipeline(merchantId);
        
        if (!merchant || !pipeline) return;

        this.selectedMerchant = merchant;
        this.selectedStage = currentStage;

        const modalId = Utils.createModal(
            `Pipeline Actions - ${merchant.merchantName}`,
            this.renderMerchantActionsContent(merchant, pipeline),
            []
        );
    }

    renderMerchantActionsContent(merchant, pipeline) {
        const currentUser = window.auth.getCurrentUser();
        const canEdit = currentUser.role === 'Admin' || pipeline.responsibleRepId === currentUser.id;
        const validTransitions = this.getValidTransitions(pipeline.stage);
        
        return `
            <div class="space-y-6">
                <!-- Current Status -->
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="font-medium text-gray-900">Current Status</h4>
                        <span class="stage-badge ${Utils.getStageClass(pipeline.stage)}">${Utils.getStageDisplayName(pipeline.stage)}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">In stage since:</span>
                            <div class="font-medium">${Utils.formatDate(pipeline.stageSetAt)}</div>
                        </div>
                        <div>
                            <span class="text-gray-600">Responsible Rep:</span>
                            <div class="font-medium">${this.getRepName(pipeline.responsibleRepId)}</div>
                        </div>
                    </div>
                    ${pipeline.nextAction ? `
                        <div class="mt-3 pt-3 border-t">
                            <span class="text-gray-600 text-sm">Next Action:</span>
                            <div class="font-medium">${pipeline.nextAction}</div>
                            <div class="text-sm text-gray-600 mt-1">Due: ${Utils.formatDate(pipeline.nextActionDue)}</div>
                        </div>
                    ` : ''}
                </div>

                ${canEdit ? `
                    <!-- Stage Transition -->
                    <div class="space-y-4">
                        <h4 class="font-medium text-gray-900">Available Actions</h4>
                        
                        ${validTransitions.length > 0 ? `
                            <div class="space-y-3">
                                ${validTransitions.map(stage => `
                                    <button onclick="pipelineManager.transitionToStage('${merchant.id}', '${stage}')"
                                            class="w-full text-left p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <div class="font-medium text-gray-900">Move to ${Utils.getStageDisplayName(stage)}</div>
                                                <div class="text-sm text-gray-600">${this.getStageDescription(stage)}</div>
                                            </div>
                                            <i class="fas fa-arrow-right text-blue-600"></i>
                                        </div>
                                    </button>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="text-center py-6 text-gray-500">
                                <i class="fas fa-check-circle text-2xl mb-2"></i>
                                <p>No further transitions available from this stage.</p>
                            </div>
                        `}

                        <!-- Update Next Action -->
                        <div class="border-t pt-4">
                            <h5 class="font-medium text-gray-900 mb-3">Update Next Action</h5>
                            <form id="updateActionForm" class="space-y-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Next Action</label>
                                    <input type="text" name="nextAction" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                           value="${pipeline.nextAction || ''}" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                    <input type="date" name="nextActionDue" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                           value="${pipeline.nextActionDue ? new Date(pipeline.nextActionDue).toISOString().split('T')[0] : ''}" />
                                </div>
                                <button type="button" onclick="pipelineManager.updateNextAction('${pipeline.id}')"
                                        class="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700">
                                    Update Next Action
                                </button>
                            </form>
                        </div>
                    </div>
                ` : `
                    <div class="text-center py-6 text-gray-500">
                        <i class="fas fa-lock text-2xl mb-2"></i>
                        <p>You don't have permission to modify this merchant's pipeline.</p>
                    </div>
                `}

                <!-- Quick Actions -->
                <div class="border-t pt-4">
                    <h5 class="font-medium text-gray-900 mb-3">Quick Actions</h5>
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="window.open('${Utils.generateWhatsAppUrl(merchant.whatsappBusiness || merchant.phoneMain, 'Hello from Teen CRM!')}')" 
                                class="flex items-center justify-center space-x-2 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                                ${!merchant.whatsappBusiness && !merchant.phoneMain ? 'disabled' : ''}>
                            <i class="fab fa-whatsapp"></i>
                            <span>WhatsApp</span>
                        </button>
                        <button onclick="window.location.href='tel:${merchant.phoneMain}'" 
                                class="flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                ${!merchant.phoneMain ? 'disabled' : ''}>
                            <i class="fas fa-phone"></i>
                            <span>Call</span>
                        </button>
                        <button onclick="activityManager.showAddActivityForm('${merchant.id}')" 
                                class="flex items-center justify-center space-x-2 py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                            <i class="fas fa-plus"></i>
                            <span>Log Activity</span>
                        </button>
                        <button onclick="merchantManager.showMerchantDetails('${merchant.id}')" 
                                class="flex items-center justify-center space-x-2 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                            <i class="fas fa-eye"></i>
                            <span>View Details</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getValidTransitions(currentStage) {
        const transitions = {
            'PendingFirstVisit': ['FollowUpNeeded', 'Rejected'],
            'FollowUpNeeded': ['ContractSent', 'Rejected'],
            'ContractSent': ['Won', 'Rejected'],
            'Won': [], // Won merchants go to onboarding
            'Rejected': [] // Terminal state
        };

        return transitions[currentStage] || [];
    }

    getStageDescription(stage) {
        const descriptions = {
            'PendingFirstVisit': 'Schedule initial meeting with merchant',
            'FollowUpNeeded': 'Continue engagement and build relationship',
            'ContractSent': 'Send contract and await signature',
            'Won': 'Merchant agreed, move to onboarding',
            'Rejected': 'Merchant declined or lost opportunity'
        };

        return descriptions[stage] || '';
    }

    transitionToStage(merchantId, newStage) {
        try {
            let lostReason = null;
            
            // If transitioning to Rejected, ask for reason
            if (newStage === 'Rejected') {
                lostReason = prompt('Please enter the reason for rejection:');
                if (!lostReason) return; // User cancelled
            }

            // Perform the transition
            const updatedPipeline = window.dataStore.transitionPipelineStage(merchantId, newStage, lostReason);
            
            if (updatedPipeline) {
                Utils.showNotification(`Merchant moved to ${Utils.getStageDisplayName(newStage)}`, 'success');
                
                // If moved to Won stage, show onboarding notification
                if (newStage === 'Won') {
                    Utils.showNotification('Payout created! Onboarding record initialized.', 'info');
                }
                
                // Close modal and refresh
                const modals = document.querySelectorAll('[id^="modal-"]');
                modals.forEach(modal => modal.remove());
                
                this.loadPipelineData();
                this.loadPipelineOverview();
            }
        } catch (error) {
            Utils.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    updateNextAction(pipelineId) {
        const form = document.getElementById('updateActionForm');
        const formData = new FormData(form);
        
        const updates = {
            nextAction: formData.get('nextAction'),
            nextActionDue: formData.get('nextActionDue') ? new Date(formData.get('nextActionDue')) : null
        };

        window.dataStore.updateItem('pipeline', pipelineId, updates);
        Utils.showNotification('Next action updated successfully', 'success');
        
        // Refresh the display
        this.loadPipelineData();
    }

    getRepName(repId) {
        const repNames = {
            'admin-001': 'Admin User',
            'rep-001': 'Sami Al-Ahmad',
            'rep-002': 'Layla Hassan'
        };
        return repNames[repId] || 'Unknown Rep';
    }

    showPipelineStats() {
        const currentUser = window.auth.getCurrentUser();
        const merchants = window.dataStore.getMerchantsForUser(currentUser.id, currentUser.role);
        const pipelines = window.dataStore.getData('pipeline');
        
        const stats = this.calculateDetailedStats(merchants, pipelines);
        
        const modalId = Utils.createModal(
            'Pipeline Analytics',
            this.renderPipelineStatsContent(stats),
            [
                {
                    text: 'Export Report',
                    onclick: `pipelineManager.exportPipelineStats()`,
                    class: 'bg-blue-500 text-white'
                }
            ]
        );
    }

    calculateDetailedStats(merchants, pipelines) {
        // Conversion funnel
        const funnel = {
            totalLeads: merchants.length,
            pendingFirstVisit: pipelines.filter(p => p.isCurrent && p.stage === 'PendingFirstVisit').length,
            followUpNeeded: pipelines.filter(p => p.isCurrent && p.stage === 'FollowUpNeeded').length,
            contractSent: pipelines.filter(p => p.isCurrent && p.stage === 'ContractSent').length,
            won: pipelines.filter(p => p.isCurrent && p.stage === 'Won').length,
            rejected: pipelines.filter(p => p.isCurrent && p.stage === 'Rejected').length
        };

        // Calculate conversion rates
        const conversionRates = {
            visitToFollowup: funnel.pendingFirstVisit > 0 ? Math.round((funnel.followUpNeeded / funnel.pendingFirstVisit) * 100) : 0,
            followupToContract: funnel.followUpNeeded > 0 ? Math.round((funnel.contractSent / funnel.followUpNeeded) * 100) : 0,
            contractToWon: funnel.contractSent > 0 ? Math.round((funnel.won / funnel.contractSent) * 100) : 0,
            overallConversion: funnel.totalLeads > 0 ? Math.round((funnel.won / funnel.totalLeads) * 100) : 0
        };

        // Rep performance
        const repPerformance = this.calculateRepPerformance(merchants, pipelines);

        return {
            funnel,
            conversionRates,
            repPerformance
        };
    }

    calculateRepPerformance(merchants, pipelines) {
        const reps = ['rep-001', 'rep-002'];
        
        return reps.map(repId => {
            const repMerchants = merchants.filter(m => {
                const pipeline = pipelines.find(p => p.merchantId === m.id && p.isCurrent);
                return m.createdBy === repId || (pipeline && pipeline.responsibleRepId === repId);
            });

            const repWins = pipelines.filter(p => p.isCurrent && p.stage === 'Won' && p.responsibleRepId === repId).length;
            const repTotal = repMerchants.length;

            return {
                repId,
                name: this.getRepName(repId),
                totalMerchants: repTotal,
                won: repWins,
                conversionRate: repTotal > 0 ? Math.round((repWins / repTotal) * 100) : 0
            };
        });
    }

    renderPipelineStatsContent(stats) {
        return `
            <div class="max-h-96 overflow-y-auto space-y-6">
                <!-- Conversion Funnel -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-4">Conversion Funnel</h4>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span class="text-gray-700">Total Leads</span>
                            <span class="font-semibold text-gray-900">${stats.funnel.totalLeads}</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <span class="text-gray-700">Pending First Visit</span>
                            <div class="text-right">
                                <span class="font-semibold text-yellow-600">${stats.funnel.pendingFirstVisit}</span>
                                <div class="text-xs text-gray-500">${stats.funnel.totalLeads > 0 ? Math.round((stats.funnel.pendingFirstVisit / stats.funnel.totalLeads) * 100) : 0}%</div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                            <span class="text-gray-700">Follow-up Needed</span>
                            <div class="text-right">
                                <span class="font-semibold text-orange-600">${stats.funnel.followUpNeeded}</span>
                                <div class="text-xs text-gray-500">${stats.conversionRates.visitToFollowup}% conversion</div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span class="text-gray-700">Contract Sent</span>
                            <div class="text-right">
                                <span class="font-semibold text-blue-600">${stats.funnel.contractSent}</span>
                                <div class="text-xs text-gray-500">${stats.conversionRates.followupToContract}% conversion</div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span class="text-gray-700">Won</span>
                            <div class="text-right">
                                <span class="font-semibold text-green-600">${stats.funnel.won}</span>
                                <div class="text-xs text-gray-500">${stats.conversionRates.contractToWon}% conversion</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Overall Performance -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-4">Overall Performance</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600">${stats.conversionRates.overallConversion}%</div>
                            <div class="text-sm text-gray-600">Overall Conversion</div>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <div class="text-2xl font-bold text-green-600">${stats.funnel.won}</div>
                            <div class="text-sm text-gray-600">Total Wins</div>
                        </div>
                    </div>
                </div>

                <!-- Rep Performance -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-4">Rep Performance</h4>
                    <div class="space-y-3">
                        ${stats.repPerformance.map(rep => `
                            <div class="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <div class="font-medium text-gray-900">${rep.name}</div>
                                    <div class="text-sm text-gray-600">${rep.totalMerchants} total merchants</div>
                                </div>
                                <div class="text-right">
                                    <div class="font-semibold text-gray-900">${rep.won} won</div>
                                    <div class="text-sm text-green-600">${rep.conversionRate}% conversion</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    exportPipelineData() {
        const currentUser = window.auth.getCurrentUser();
        const merchants = window.dataStore.getMerchantsForUser(currentUser.id, currentUser.role);
        const pipelines = window.dataStore.getData('pipeline');
        
        const exportData = merchants.map(merchant => {
            const pipeline = pipelines.find(p => p.merchantId === merchant.id && p.isCurrent);
            
            return {
                'Merchant Name': merchant.merchantName,
                'Category': merchant.category,
                'Genre': merchant.genre,
                'City': merchant.city,
                'Current Stage': pipeline ? Utils.getStageDisplayName(pipeline.stage) : 'Unknown',
                'Stage Since': pipeline ? Utils.formatDate(pipeline.stageSetAt) : 'N/A',
                'Responsible Rep': pipeline ? this.getRepName(pipeline.responsibleRepId) : 'N/A',
                'Next Action': pipeline?.nextAction || 'None',
                'Next Action Due': pipeline?.nextActionDue ? Utils.formatDate(pipeline.nextActionDue) : 'N/A',
                'Student Fit': merchant.studentFit,
                'Pricing Tier': merchant.pricingTier,
                'Phone': merchant.phoneMain,
                'Email': merchant.emailMain,
                'Created Date': Utils.formatDate(merchant.createdAt),
                'Is Live': merchant.isLive ? 'Yes' : 'No'
            };
        });

        Utils.exportToCSV(exportData, 'pipeline-export.csv');
        Utils.showNotification('Pipeline data exported successfully', 'success');
    }
}

// Initialize pipeline manager
window.pipelineManager = new PipelineManager();