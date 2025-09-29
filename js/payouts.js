// Payout Management System
class PayoutManager {
    constructor() {
        this.selectedPeriod = 'current_month';
        this.selectedRep = '';
    }

    render() {
        const section = document.getElementById('payoutsSection');
        
        section.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Payouts</h1>
                        <p class="text-gray-600">Manage sales representative payouts and bonuses</p>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="payoutManager.calculatePayouts()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                            <i class="fas fa-calculator"></i>
                            <span>Calculate</span>
                        </button>
                        <button onclick="payoutManager.exportPayouts()" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2">
                            <i class="fas fa-download"></i>
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                <!-- Payout Overview -->
                <div id="payoutOverview" class="bg-white rounded-lg shadow p-6">
                    <!-- Overview stats will be loaded here -->
                </div>

                <!-- Filters -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-semibold text-gray-900">Payout Reports</h2>
                        <div class="flex space-x-3">
                            <select id="payoutPeriodFilter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="current_month">This Month</option>
                                <option value="last_month">Last Month</option>
                                <option value="current_quarter">This Quarter</option>
                                <option value="last_quarter">Last Quarter</option>
                                <option value="current_year">This Year</option>
                                <option value="all_time">All Time</option>
                            </select>
                            <select id="payoutRepFilter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Reps</option>
                                ${this.getRepOptions()}
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Rep Payout Summary -->
                <div id="repPayoutSummary" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Rep cards will be loaded here -->
                </div>

                <!-- Detailed Payout Ledger -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-lg font-semibold text-gray-900">Payout Ledger</h2>
                    </div>
                    <div id="payoutLedger" class="p-6">
                        <!-- Ledger will be loaded here -->
                    </div>
                </div>

                <!-- Monthly Report Modal (hidden) -->
                <div id="monthlyReportModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div class="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
                        <div class="mt-3">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-medium text-gray-900">Monthly Payout Report</h3>
                                <button onclick="payoutManager.closeMonthlyReport()" class="text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div id="monthlyReportContent">
                                <!-- Report content will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadPayoutData();
        this.loadPayoutOverview();
    }

    setupEventListeners() {
        const periodFilter = document.getElementById('payoutPeriodFilter');
        const repFilter = document.getElementById('payoutRepFilter');

        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.selectedPeriod = e.target.value;
                this.loadPayoutData();
                this.loadPayoutOverview();
            });
        }

        if (repFilter) {
            repFilter.addEventListener('change', (e) => {
                this.selectedRep = e.target.value;
                this.loadPayoutData();
            });
        }
    }

    loadPayoutOverview() {
        const currentUser = window.auth.getCurrentUser();
        const payouts = this.getPayoutsForPeriod(this.selectedPeriod);
        const metrics = this.calculatePayoutMetrics(payouts);
        
        const overviewContainer = document.getElementById('payoutOverview');
        overviewContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Total Payouts -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-gray-900">${Utils.formatCurrency(metrics.totalAmount)}</div>
                    <div class="text-sm text-gray-600">Total Payouts</div>
                    <div class="text-xs text-gray-500">${this.getPeriodDisplayName()}</div>
                </div>
                
                <!-- Won Bonuses -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-blue-600">${Utils.formatCurrency(metrics.wonBonuses)}</div>
                    <div class="text-sm text-gray-600">Won Bonuses</div>
                    <div class="text-xs text-gray-500">${metrics.wonCount} merchants won</div>
                </div>
                
                <!-- Live Bonuses -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-green-600">${Utils.formatCurrency(metrics.liveBonuses)}</div>
                    <div class="text-sm text-gray-600">Live Bonuses</div>
                    <div class="text-xs text-gray-500">${metrics.liveCount} merchants live</div>
                </div>
                
                <!-- Active Reps -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-purple-600">${metrics.activeReps}</div>
                    <div class="text-sm text-gray-600">Active Reps</div>
                    <div class="text-xs text-gray-500">With payouts</div>
                </div>
            </div>

            <!-- Payout Type Breakdown -->
            <div class="mt-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Payout Breakdown</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-4 bg-blue-50 rounded-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-lg font-semibold text-blue-600">${Utils.formatCurrency(metrics.wonBonuses)}</div>
                                <div class="text-sm text-gray-600">Won Bonuses (9 JOD each)</div>
                            </div>
                            <div class="text-blue-600">
                                <i class="fas fa-trophy text-2xl"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-xs text-gray-500">${metrics.wonCount} × 9 JOD</div>
                    </div>
                    
                    <div class="p-4 bg-green-50 rounded-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-lg font-semibold text-green-600">${Utils.formatCurrency(metrics.liveBonuses)}</div>
                                <div class="text-sm text-gray-600">Live Bonuses (7 JOD each)</div>
                            </div>
                            <div class="text-green-600">
                                <i class="fas fa-rocket text-2xl"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-xs text-gray-500">${metrics.liveCount} × 7 JOD</div>
                    </div>
                </div>
            </div>
        `;
    }

    calculatePayoutMetrics(payouts) {
        const wonPayouts = payouts.filter(p => p.reason === 'WonBonus');
        const livePayouts = payouts.filter(p => p.reason === 'FullyOnboardedBonus');
        
        const totalAmount = payouts.reduce((sum, p) => sum + p.amountJod, 0);
        const wonBonuses = wonPayouts.reduce((sum, p) => sum + p.amountJod, 0);
        const liveBonuses = livePayouts.reduce((sum, p) => sum + p.amountJod, 0);
        
        const activeReps = new Set(payouts.map(p => p.repId)).size;
        
        return {
            totalAmount,
            wonBonuses,
            liveBonuses,
            wonCount: wonPayouts.length,
            liveCount: livePayouts.length,
            activeReps
        };
    }

    loadPayoutData() {
        const payouts = this.getPayoutsForPeriod(this.selectedPeriod);
        
        // Filter by rep if selected
        const filteredPayouts = this.selectedRep ? 
            payouts.filter(p => p.repId === this.selectedRep) : 
            payouts;

        this.loadRepPayoutSummary(filteredPayouts);
        this.loadPayoutLedger(filteredPayouts);
    }

    loadRepPayoutSummary(payouts) {
        const repSummary = this.calculateRepPayoutSummary(payouts);
        const container = document.getElementById('repPayoutSummary');
        
        const repCards = repSummary.map(rep => this.renderRepPayoutCard(rep)).join('');
        container.innerHTML = repCards;
    }

    calculateRepPayoutSummary(payouts) {
        const reps = ['rep-001', 'rep-002'];
        
        return reps.map(repId => {
            const repPayouts = payouts.filter(p => p.repId === repId);
            const wonPayouts = repPayouts.filter(p => p.reason === 'WonBonus');
            const livePayouts = repPayouts.filter(p => p.reason === 'FullyOnboardedBonus');
            
            const totalAmount = repPayouts.reduce((sum, p) => sum + p.amountJod, 0);
            const wonAmount = wonPayouts.reduce((sum, p) => sum + p.amountJod, 0);
            const liveAmount = livePayouts.reduce((sum, p) => sum + p.amountJod, 0);
            
            return {
                repId,
                name: this.getRepName(repId),
                totalAmount,
                wonAmount,
                liveAmount,
                wonCount: wonPayouts.length,
                liveCount: livePayouts.length,
                totalPayouts: repPayouts.length
            };
        });
    }

    renderRepPayoutCard(rep) {
        return `
            <div class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                 onclick="payoutManager.showRepDetails('${rep.repId}')">
                <!-- Header -->
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-blue-600 text-lg"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">${rep.name}</h3>
                            <p class="text-sm text-gray-600">Sales Representative</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold text-gray-900">${Utils.formatCurrency(rep.totalAmount)}</div>
                        <div class="text-sm text-gray-600">Total</div>
                    </div>
                </div>

                <!-- Payout Breakdown -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="text-center p-3 bg-blue-50 rounded-lg">
                        <div class="text-lg font-semibold text-blue-600">${Utils.formatCurrency(rep.wonAmount)}</div>
                        <div class="text-xs text-gray-600">Won Bonuses</div>
                        <div class="text-xs text-gray-500">${rep.wonCount} merchants</div>
                    </div>
                    <div class="text-center p-3 bg-green-50 rounded-lg">
                        <div class="text-lg font-semibold text-green-600">${Utils.formatCurrency(rep.liveAmount)}</div>
                        <div class="text-xs text-gray-600">Live Bonuses</div>
                        <div class="text-xs text-gray-500">${rep.liveCount} merchants</div>
                    </div>
                </div>

                <!-- Performance Indicators -->
                <div class="flex justify-between items-center text-sm">
                    <div class="text-gray-600">
                        <i class="fas fa-chart-line mr-1"></i>
                        ${rep.totalPayouts} total payouts
                    </div>
                    <div class="text-gray-600">
                        <i class="fas fa-trophy mr-1"></i>
                        ${rep.wonCount + rep.liveCount} achievements
                    </div>
                </div>

                <!-- Payout Badge -->
                <div class="mt-4 pt-4 border-t">
                    <span class="payout-badge px-3 py-1 rounded-full text-sm font-medium">
                        <i class="fas fa-dollar-sign mr-1"></i>
                        ${Utils.formatCurrency(rep.totalAmount)} earned
                    </span>
                </div>
            </div>
        `;
    }

    loadPayoutLedger(payouts) {
        const container = document.getElementById('payoutLedger');
        
        if (payouts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-receipt text-gray-400 text-4xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No payouts found</h3>
                    <p class="text-gray-600">Payouts will appear here when merchants reach Won or Live status.</p>
                </div>
            `;
            return;
        }

        // Sort payouts by date (newest first)
        const sortedPayouts = [...payouts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const ledgerRows = sortedPayouts.map(payout => this.renderPayoutLedgerRow(payout)).join('');
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rep</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${ledgerRows}
                    </tbody>
                    <tfoot class="bg-gray-50">
                        <tr>
                            <td colspan="4" class="px-6 py-4 text-sm font-medium text-gray-900">Total:</td>
                            <td class="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                ${Utils.formatCurrency(payouts.reduce((sum, p) => sum + p.amountJod, 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    renderPayoutLedgerRow(payout) {
        const merchant = window.dataStore.findItem('merchants', payout.merchantId);
        const repName = this.getRepName(payout.repId);
        
        const reasonDisplayName = {
            'WonBonus': 'Won Bonus',
            'FullyOnboardedBonus': 'Live Bonus'
        };

        const reasonClass = {
            'WonBonus': 'text-blue-600 bg-blue-100',
            'FullyOnboardedBonus': 'text-green-600 bg-green-100'
        };

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Utils.formatDate(payout.createdAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${repName}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${merchant ? merchant.merchantName : 'Unknown Merchant'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${reasonClass[payout.reason]}">
                        ${reasonDisplayName[payout.reason]}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    ${Utils.formatCurrency(payout.amountJod)}
                </td>
            </tr>
        `;
    }

    showRepDetails(repId) {
        const payouts = this.getPayoutsForPeriod(this.selectedPeriod).filter(p => p.repId === repId);
        const repName = this.getRepName(repId);
        const repSummary = this.calculateRepPayoutSummary(payouts)[0];
        
        const modalId = Utils.createModal(
            `${repName} - Payout Details`,
            this.renderRepDetailsContent(repSummary, payouts),
            [
                {
                    text: 'Generate Report',
                    onclick: `payoutManager.generateRepReport('${repId}')`,
                    class: 'bg-blue-500 text-white'
                }
            ]
        );
    }

    renderRepDetailsContent(repSummary, payouts) {
        const merchants = window.dataStore.getData('merchants');
        
        return `
            <div class="max-h-96 overflow-y-auto space-y-6">
                <!-- Summary Stats -->
                <div class="grid grid-cols-3 gap-4">
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <div class="text-2xl font-bold text-gray-900">${Utils.formatCurrency(repSummary.totalAmount)}</div>
                        <div class="text-sm text-gray-600">Total Earned</div>
                    </div>
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <div class="text-2xl font-bold text-blue-600">${repSummary.wonCount}</div>
                        <div class="text-sm text-gray-600">Won Merchants</div>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <div class="text-2xl font-bold text-green-600">${repSummary.liveCount}</div>
                        <div class="text-sm text-gray-600">Live Merchants</div>
                    </div>
                </div>

                <!-- Performance Breakdown -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-3">Performance Breakdown</h4>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div>
                                <div class="font-medium text-blue-900">Won Bonuses</div>
                                <div class="text-sm text-blue-600">${repSummary.wonCount} merchants × 9 JOD</div>
                            </div>
                            <div class="font-bold text-blue-600">${Utils.formatCurrency(repSummary.wonAmount)}</div>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div>
                                <div class="font-medium text-green-900">Live Bonuses</div>
                                <div class="text-sm text-green-600">${repSummary.liveCount} merchants × 7 JOD</div>
                            </div>
                            <div class="font-bold text-green-600">${Utils.formatCurrency(repSummary.liveAmount)}</div>
                        </div>
                    </div>
                </div>

                <!-- Recent Payouts -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-3">Recent Payouts</h4>
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                        ${payouts.slice(0, 10).map(payout => {
                            const merchant = merchants.find(m => m.id === payout.merchantId);
                            const reasonClass = payout.reason === 'WonBonus' ? 'text-blue-600' : 'text-green-600';
                            
                            return `
                                <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                    <div>
                                        <div class="font-medium text-gray-900">${merchant ? merchant.merchantName : 'Unknown'}</div>
                                        <div class="text-sm text-gray-600">${Utils.formatDate(payout.createdAt)}</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-medium ${reasonClass}">${Utils.formatCurrency(payout.amountJod)}</div>
                                        <div class="text-sm text-gray-500">${payout.reason === 'WonBonus' ? 'Won' : 'Live'}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    calculatePayouts() {
        // Simulate manual payout calculation/recalculation
        const currentUser = window.auth.getCurrentUser();
        
        if (currentUser.role !== 'Admin') {
            Utils.showNotification('Only administrators can calculate payouts', 'error');
            return;
        }

        Utils.showNotification('Calculating payouts...', 'info');
        
        // Simulate calculation process
        setTimeout(() => {
            // In a real system, this would recalculate all payouts based on current merchant statuses
            // For this demo, we'll just show success
            Utils.showNotification('Payouts calculated successfully', 'success');
            
            // Refresh the data
            this.loadPayoutData();
            this.loadPayoutOverview();
        }, 1500);
    }

    exportPayouts() {
        const payouts = this.getPayoutsForPeriod(this.selectedPeriod);
        const merchants = window.dataStore.getData('merchants');
        
        const exportData = payouts.map(payout => {
            const merchant = merchants.find(m => m.id === payout.merchantId);
            
            return {
                'Date': Utils.formatDate(payout.createdAt),
                'Rep Name': this.getRepName(payout.repId),
                'Merchant Name': merchant ? merchant.merchantName : 'Unknown',
                'Merchant Category': merchant ? merchant.category : 'Unknown',
                'Merchant City': merchant ? merchant.city : 'Unknown',
                'Payout Type': payout.reason === 'WonBonus' ? 'Won Bonus' : 'Live Bonus',
                'Amount (JOD)': payout.amountJod,
                'Payout ID': payout.id
            };
        });

        const filename = `payouts-${this.selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
        Utils.exportToCSV(exportData, filename);
        Utils.showNotification('Payouts exported successfully', 'success');
    }

    generateRepReport(repId) {
        const repName = this.getRepName(repId);
        const payouts = this.getPayoutsForPeriod(this.selectedPeriod).filter(p => p.repId === repId);
        
        // Show monthly report modal
        this.showMonthlyReport(repId, payouts);
    }

    showMonthlyReport(repId, payouts) {
        const repName = this.getRepName(repId);
        const merchants = window.dataStore.getData('merchants');
        const repSummary = this.calculateRepPayoutSummary(payouts)[0];
        
        const modal = document.getElementById('monthlyReportModal');
        const content = document.getElementById('monthlyReportContent');
        
        content.innerHTML = `
            <div class="space-y-6">
                <!-- Report Header -->
                <div class="text-center pb-6 border-b">
                    <h2 class="text-2xl font-bold text-gray-900">Teen CRM - Payout Report</h2>
                    <p class="text-gray-600 mt-2">${repName} • ${this.getPeriodDisplayName()}</p>
                    <p class="text-sm text-gray-500">Generated on ${Utils.formatDate(new Date(), 'long')}</p>
                </div>

                <!-- Executive Summary -->
                <div class="bg-gray-50 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-gray-900">${Utils.formatCurrency(repSummary.totalAmount)}</div>
                            <div class="text-sm text-gray-600">Total Earnings</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600">${repSummary.wonCount}</div>
                            <div class="text-sm text-gray-600">Won Merchants</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600">${repSummary.liveCount}</div>
                            <div class="text-sm text-gray-600">Live Merchants</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-purple-600">${repSummary.totalPayouts}</div>
                            <div class="text-sm text-gray-600">Total Payouts</div>
                        </div>
                    </div>
                </div>

                <!-- Payout Breakdown -->
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Payout Breakdown</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${payouts.map(payout => {
                                    const merchant = merchants.find(m => m.id === payout.merchantId);
                                    return `
                                        <tr>
                                            <td class="px-4 py-3 text-sm text-gray-900">${Utils.formatDate(payout.createdAt)}</td>
                                            <td class="px-4 py-3 text-sm text-gray-900">${merchant ? merchant.merchantName : 'Unknown'}</td>
                                            <td class="px-4 py-3 text-sm text-gray-600">${merchant ? merchant.category : 'Unknown'}</td>
                                            <td class="px-4 py-3 text-sm">
                                                <span class="px-2 py-1 text-xs font-medium rounded-full ${payout.reason === 'WonBonus' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                                                    ${payout.reason === 'WonBonus' ? 'Won Bonus' : 'Live Bonus'}
                                                </span>
                                            </td>
                                            <td class="px-4 py-3 text-sm font-medium text-gray-900 text-right">${Utils.formatCurrency(payout.amountJod)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                            <tfoot class="bg-gray-50">
                                <tr>
                                    <td colspan="4" class="px-4 py-3 text-sm font-medium text-gray-900">Total:</td>
                                    <td class="px-4 py-3 text-sm font-bold text-gray-900 text-right">${Utils.formatCurrency(repSummary.totalAmount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex justify-center space-x-4 pt-6 border-t">
                    <button onclick="payoutManager.printReport()" class="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700">
                        <i class="fas fa-print mr-2"></i>Print Report
                    </button>
                    <button onclick="payoutManager.exportRepData('${repId}')" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                        <i class="fas fa-download mr-2"></i>Export CSV
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    closeMonthlyReport() {
        document.getElementById('monthlyReportModal').classList.add('hidden');
    }

    printReport() {
        window.print();
    }

    exportRepData(repId) {
        const payouts = this.getPayoutsForPeriod(this.selectedPeriod).filter(p => p.repId === repId);
        const merchants = window.dataStore.getData('merchants');
        const repName = this.getRepName(repId);
        
        const exportData = payouts.map(payout => {
            const merchant = merchants.find(m => m.id === payout.merchantId);
            
            return {
                'Rep Name': repName,
                'Date': Utils.formatDate(payout.createdAt),
                'Merchant Name': merchant ? merchant.merchantName : 'Unknown',
                'Category': merchant ? merchant.category : 'Unknown',
                'City': merchant ? merchant.city : 'Unknown',
                'Payout Type': payout.reason === 'WonBonus' ? 'Won Bonus' : 'Live Bonus',
                'Amount (JOD)': payout.amountJod,
                'Period': this.getPeriodDisplayName()
            };
        });

        const filename = `${repName.replace(/\s+/g, '_')}-payouts-${this.selectedPeriod}.csv`;
        Utils.exportToCSV(exportData, filename);
        Utils.showNotification('Rep data exported successfully', 'success');
    }

    getPayoutsForPeriod(period) {
        const allPayouts = window.dataStore.getData('payouts');
        const now = new Date();
        
        return allPayouts.filter(payout => {
            const payoutDate = new Date(payout.createdAt);
            
            switch (period) {
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
                
                case 'last_quarter':
                    const lastQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
                    const lastQuarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);
                    return payoutDate >= lastQuarterStart && payoutDate <= lastQuarterEnd;
                
                case 'current_year':
                    return payoutDate.getFullYear() === now.getFullYear();
                
                case 'all_time':
                default:
                    return true;
            }
        });
    }

    getPeriodDisplayName() {
        const periodNames = {
            'current_month': 'This Month',
            'last_month': 'Last Month',
            'current_quarter': 'This Quarter',
            'last_quarter': 'Last Quarter',
            'current_year': 'This Year',
            'all_time': 'All Time'
        };
        return periodNames[this.selectedPeriod] || 'All Time';
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

// Initialize payout manager
window.payoutManager = new PayoutManager();