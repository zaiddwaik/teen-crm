// Merchant Management System
class MerchantManager {
    constructor() {
        this.currentView = 'list';
        this.selectedMerchant = null;
        this.filters = {
            search: '',
            category: '',
            stage: '',
            rep: '',
            city: '',
            studentFit: ''
        };
        this.sortBy = 'updatedAt';
        this.sortOrder = 'desc';
    }

    render() {
        const section = document.getElementById('merchantsSection');
        
        section.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Merchants</h1>
                        <p class="text-gray-600">Manage your merchant partners</p>
                    </div>
                    <button onclick="merchantManager.showAddMerchantForm()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                        <i class="fas fa-plus"></i>
                        <span>Add Merchant</span>
                    </button>
                </div>

                <!-- Filters -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <input type="text" id="merchantSearch" placeholder="Search merchants..." 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   value="${this.filters.search}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select id="categoryFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Categories</option>
                                <option value="Food">Food</option>
                                <option value="Desserts & Coffee">Desserts & Coffee</option>
                                <option value="Beauty">Beauty</option>
                                <option value="Clothing">Clothing</option>
                                <option value="Services">Services</option>
                                <option value="Sports">Sports</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Tourism">Tourism</option>
                                <option value="Health">Health</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Education">Education</option>
                                <option value="Application">Application</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                            <select id="stageFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Stages</option>
                                <option value="PendingFirstVisit">Pending First Visit</option>
                                <option value="FollowUpNeeded">Follow-up Needed</option>
                                <option value="ContractSent">Contract Sent</option>
                                <option value="Won">Won</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Rep</label>
                            <select id="repFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Reps</option>
                                ${this.getRepOptions()}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <select id="cityFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Cities</option>
                                ${this.getCityOptions()}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Student Fit</label>
                            <select id="studentFitFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Fits</option>
                                <option value="Strong">Strong</option>
                                <option value="Medium">Medium</option>
                                <option value="Weak">Weak</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex justify-between items-center mt-4">
                        <button onclick="merchantManager.clearFilters()" class="text-gray-600 hover:text-gray-800">
                            <i class="fas fa-times-circle mr-1"></i> Clear Filters
                        </button>
                        <div class="flex items-center space-x-4">
                            <span class="text-sm text-gray-600">Sort by:</span>
                            <select id="sortBy" class="px-3 py-1 border border-gray-300 rounded-md text-sm">
                                <option value="updatedAt">Last Updated</option>
                                <option value="merchantName">Name</option>
                                <option value="createdAt">Created Date</option>
                                <option value="city">City</option>
                            </select>
                            <button onclick="merchantManager.toggleSort()" class="text-gray-600 hover:text-gray-800">
                                <i class="fas fa-sort-${this.sortOrder === 'asc' ? 'up' : 'down'}"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Merchants List -->
                <div id="merchantsList" class="space-y-4">
                    <!-- Merchants will be loaded here -->
                </div>

                <!-- Pagination -->
                <div id="merchantsPagination" class="flex justify-center">
                    <!-- Pagination will be loaded here -->
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadMerchants();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('merchantSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const stageFilter = document.getElementById('stageFilter');
        const repFilter = document.getElementById('repFilter');
        const cityFilter = document.getElementById('cityFilter');
        const studentFitFilter = document.getElementById('studentFitFilter');
        const sortBy = document.getElementById('sortBy');

        // Debounced search
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filters.search = e.target.value;
                this.loadMerchants();
            }, 300));
        }

        // Filter changes
        [categoryFilter, stageFilter, repFilter, cityFilter, studentFitFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', (e) => {
                    this.filters[e.target.id.replace('Filter', '')] = e.target.value;
                    this.loadMerchants();
                });
            }
        });

        // Sort changes
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.loadMerchants();
            });
        }
    }

    loadMerchants() {
        const currentUser = window.auth.getCurrentUser();
        const allMerchants = window.dataStore.getMerchantsForUser(currentUser.id, currentUser.role);
        
        // Apply filters
        let filteredMerchants = allMerchants.filter(merchant => {
            const pipeline = window.dataStore.getCurrentPipeline(merchant.id);
            const matchesSearch = !this.filters.search || 
                merchant.merchantName.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                merchant.city.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                merchant.category.toLowerCase().includes(this.filters.search.toLowerCase());
            
            const matchesCategory = !this.filters.category || merchant.category === this.filters.category;
            const matchesStage = !this.filters.stage || (pipeline && pipeline.stage === this.filters.stage);
            const matchesRep = !this.filters.rep || merchant.createdBy === this.filters.rep || 
                (pipeline && pipeline.responsibleRepId === this.filters.rep);
            const matchesCity = !this.filters.city || merchant.city === this.filters.city;
            const matchesStudentFit = !this.filters.studentFit || merchant.studentFit === this.filters.studentFit;

            return matchesSearch && matchesCategory && matchesStage && 
                   matchesRep && matchesCity && matchesStudentFit;
        });

        // Apply sorting
        filteredMerchants.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];

            if (this.sortBy.includes('At')) {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        this.renderMerchantsList(filteredMerchants);
    }

    renderMerchantsList(merchants) {
        const container = document.getElementById('merchantsList');
        
        if (merchants.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-store text-gray-400 text-4xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No merchants found</h3>
                    <p class="text-gray-600">Try adjusting your filters or add a new merchant.</p>
                </div>
            `;
            return;
        }

        const merchantCards = merchants.map(merchant => this.renderMerchantCard(merchant)).join('');
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${merchantCards}
            </div>
        `;
    }

    renderMerchantCard(merchant) {
        const pipeline = window.dataStore.getCurrentPipeline(merchant.id);
        const onboarding = window.dataStore.getOnboarding(merchant.id);
        const activities = window.dataStore.getActivitiesForMerchant(merchant.id);
        const lastActivity = activities[0];

        const isLive = merchant.isLive;
        const stageClass = isLive ? 'stage-live' : (pipeline ? Utils.getStageClass(pipeline.stage) : 'stage-pending');
        const stageName = isLive ? 'Live' : (pipeline ? Utils.getStageDisplayName(pipeline.stage) : 'New');
        
        return `
            <div class="merchant-card bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 cursor-pointer"
                 onclick="merchantManager.showMerchantDetails('${merchant.id}')">
                <div class="p-6">
                    <!-- Header -->
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="${Utils.getCategoryIcon(merchant.category)} text-blue-600 text-lg"></i>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900 truncate">${merchant.merchantName}</h3>
                                <p class="text-sm text-gray-600">${merchant.category} • ${merchant.city}</p>
                            </div>
                        </div>
                        <span class="stage-badge ${stageClass}">${stageName}</span>
                    </div>

                    <!-- Details -->
                    <div class="space-y-3">
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-600">Genre:</span>
                            <span class="text-gray-900">${merchant.genre}</span>
                        </div>
                        
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-600">Pricing:</span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${Utils.getPricingTierClass(merchant.pricingTier)}">
                                ${merchant.pricingTier}
                            </span>
                        </div>

                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-600">Student Fit:</span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${Utils.getStudentFitClass(merchant.studentFit)}">
                                ${merchant.studentFit}
                            </span>
                        </div>

                        ${pipeline && pipeline.nextAction ? `
                            <div class="border-t pt-3">
                                <div class="flex items-center text-sm">
                                    <i class="fas fa-clock text-gray-400 mr-2"></i>
                                    <span class="text-gray-600">Next: ${Utils.truncateText(pipeline.nextAction, 30)}</span>
                                </div>
                                <div class="text-xs text-gray-500 mt-1">
                                    Due: ${Utils.formatDate(pipeline.nextActionDue)}
                                </div>
                            </div>
                        ` : ''}

                        ${lastActivity ? `
                            <div class="border-t pt-3">
                                <div class="flex items-center text-sm">
                                    <i class="${Utils.getActivityIcon(lastActivity.type)} text-gray-400 mr-2"></i>
                                    <span class="text-gray-600">Last activity: ${Utils.timeAgo(lastActivity.occurredAt)}</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-between items-center mt-4 pt-4 border-t">
                        <div class="flex space-x-2">
                            ${merchant.phoneMain ? `
                                <a href="tel:${merchant.phoneMain}" class="text-blue-600 hover:text-blue-700" title="Call">
                                    <i class="fas fa-phone"></i>
                                </a>
                            ` : ''}
                            ${merchant.whatsappBusiness ? `
                                <a href="${Utils.generateWhatsAppUrl(merchant.whatsappBusiness)}" target="_blank" 
                                   class="text-green-600 hover:text-green-700" title="WhatsApp">
                                    <i class="fab fa-whatsapp"></i>
                                </a>
                            ` : ''}
                            ${merchant.emailMain ? `
                                <a href="mailto:${merchant.emailMain}" class="text-gray-600 hover:text-gray-700" title="Email">
                                    <i class="fas fa-envelope"></i>
                                </a>
                            ` : ''}
                        </div>
                        <div class="text-xs text-gray-500">
                            Updated ${Utils.timeAgo(merchant.updatedAt)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showMerchantDetails(merchantId) {
        const merchant = window.dataStore.findItem('merchants', merchantId);
        if (!merchant) return;

        this.selectedMerchant = merchant;
        const pipeline = window.dataStore.getCurrentPipeline(merchantId);
        const onboarding = window.dataStore.getOnboarding(merchantId);
        const activities = window.dataStore.getActivitiesForMerchant(merchantId);

        const modalId = Utils.createModal(
            `${merchant.merchantName} Details`,
            this.renderMerchantDetailsContent(merchant, pipeline, onboarding, activities),
            [
                {
                    text: 'Edit Merchant',
                    onclick: `Utils.closeModal('${modalId}'); merchantManager.showEditMerchantForm('${merchantId}')`,
                    class: 'bg-blue-500 text-white'
                }
            ]
        );
    }

    renderMerchantDetailsContent(merchant, pipeline, onboarding, activities) {
        const isLive = merchant.isLive;
        const stageClass = isLive ? 'stage-live' : (pipeline ? Utils.getStageClass(pipeline.stage) : 'stage-pending');
        const stageName = isLive ? 'Live' : (pipeline ? Utils.getStageDisplayName(pipeline.stage) : 'New');

        return `
            <div class="max-h-96 overflow-y-auto">
                <!-- Status -->
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div class="flex justify-between items-center">
                        <span class="font-medium text-gray-900">Current Status:</span>
                        <span class="stage-badge ${stageClass}">${stageName}</span>
                    </div>
                    ${pipeline && pipeline.nextAction ? `
                        <div class="mt-2 text-sm text-gray-600">
                            <strong>Next Action:</strong> ${pipeline.nextAction}<br>
                            <strong>Due:</strong> ${Utils.formatDate(pipeline.nextActionDue)}
                        </div>
                    ` : ''}
                </div>

                <!-- Basic Info -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="font-medium text-gray-900">Legal Name:</label>
                        <p class="text-gray-600">${merchant.legalName}</p>
                    </div>
                    <div>
                        <label class="font-medium text-gray-900">Category:</label>
                        <p class="text-gray-600">${merchant.category} - ${merchant.genre}</p>
                    </div>
                    <div>
                        <label class="font-medium text-gray-900">Location:</label>
                        <p class="text-gray-600">${merchant.neighborhood}, ${merchant.city}</p>
                    </div>
                    <div>
                        <label class="font-medium text-gray-900">Branches:</label>
                        <p class="text-gray-600">${merchant.numBranches} branch${merchant.numBranches !== 1 ? 'es' : ''}</p>
                    </div>
                </div>

                <!-- Contact Info -->
                <div class="mb-6">
                    <h4 class="font-medium text-gray-900 mb-3">Contact Information</h4>
                    <div class="grid grid-cols-2 gap-4">
                        ${merchant.phoneMain ? `
                            <div>
                                <label class="font-medium text-gray-700">Phone:</label>
                                <p class="text-gray-600">${merchant.phoneMain}</p>
                            </div>
                        ` : ''}
                        ${merchant.emailMain ? `
                            <div>
                                <label class="font-medium text-gray-700">Email:</label>
                                <p class="text-gray-600">${merchant.emailMain}</p>
                            </div>
                        ` : ''}
                        ${merchant.whatsappBusiness ? `
                            <div>
                                <label class="font-medium text-gray-700">WhatsApp:</label>
                                <p class="text-gray-600">${merchant.whatsappBusiness}</p>
                            </div>
                        ` : ''}
                        ${merchant.website ? `
                            <div>
                                <label class="font-medium text-gray-700">Website:</label>
                                <p class="text-gray-600"><a href="${merchant.website}" target="_blank" class="text-blue-600 hover:underline">${merchant.website}</a></p>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Business Details -->
                <div class="mb-6">
                    <h4 class="font-medium text-gray-900 mb-3">Business Details</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="font-medium text-gray-700">Pricing Tier:</label>
                            <p class="text-gray-600">${merchant.pricingTier}</p>
                        </div>
                        <div>
                            <label class="font-medium text-gray-700">Student Fit:</label>
                            <p class="text-gray-600">${merchant.studentFit}</p>
                        </div>
                        <div>
                            <label class="font-medium text-gray-700">Opening Hours:</label>
                            <p class="text-gray-600">${merchant.openingHours}</p>
                        </div>
                        <div>
                            <label class="font-medium text-gray-700">Services:</label>
                            <p class="text-gray-600">
                                ${[
                                    merchant.deliveryAvailable ? 'Delivery' : null,
                                    merchant.dineIn ? 'Dine-in' : null,
                                    merchant.takeAway ? 'Take-away' : null
                                ].filter(Boolean).join(', ') || 'None specified'}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Recent Activities -->
                ${activities.length > 0 ? `
                    <div class="mb-6">
                        <h4 class="font-medium text-gray-900 mb-3">Recent Activities</h4>
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                            ${activities.slice(0, 3).map(activity => `
                                <div class="flex items-center space-x-3 text-sm">
                                    <i class="${Utils.getActivityIcon(activity.type)} text-gray-400"></i>
                                    <span class="text-gray-600">${activity.type}</span>
                                    <span class="text-gray-500">${Utils.timeAgo(activity.occurredAt)}</span>
                                </div>
                                <p class="text-sm text-gray-700 ml-6">${Utils.truncateText(activity.summary, 80)}</p>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    showAddMerchantForm() {
        const modalId = Utils.createModal(
            'Add New Merchant',
            this.renderMerchantForm(),
            [
                {
                    text: 'Save Merchant',
                    onclick: `merchantManager.saveMerchant('${modalId}')`,
                    class: 'bg-blue-500 text-white'
                }
            ]
        );
    }

    showEditMerchantForm(merchantId) {
        this.selectedMerchant = window.dataStore.findItem('merchants', merchantId);
        
        const modalId = Utils.createModal(
            'Edit Merchant',
            this.renderMerchantForm(this.selectedMerchant),
            [
                {
                    text: 'Update Merchant',
                    onclick: `merchantManager.saveMerchant('${modalId}', '${merchantId}')`,
                    class: 'bg-blue-500 text-white'
                }
            ]
        );
    }

    renderMerchantForm(merchant = null) {
        const isEdit = !!merchant;
        
        return `
            <form id="merchantForm" class="space-y-4 max-h-96 overflow-y-auto">
                <!-- Basic Information -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Merchant Name *</label>
                        <input type="text" name="merchantName" required
                               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value="${merchant ? merchant.merchantName : ''}" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Legal Name</label>
                        <input type="text" name="legalName"
                               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value="${merchant ? merchant.legalName : ''}" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Category *</label>
                        <select name="category" required class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select Category</option>
                            ${['Food', 'Desserts & Coffee', 'Beauty', 'Clothing', 'Services', 'Sports', 'Entertainment', 'Tourism', 'Health', 'Electronics', 'Education', 'Application'].map(cat => 
                                `<option value="${cat}" ${merchant && merchant.category === cat ? 'selected' : ''}>${cat}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Genre</label>
                        <input type="text" name="genre"
                               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value="${merchant ? merchant.genre : ''}" />
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Pricing Tier</label>
                        <select name="pricingTier" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            ${['Budget', 'Mid', 'Premium', 'Luxury'].map(tier => 
                                `<option value="${tier}" ${merchant && merchant.pricingTier === tier ? 'selected' : ''}>${tier}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Student Fit</label>
                        <select name="studentFit" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            ${['Strong', 'Medium', 'Weak'].map(fit => 
                                `<option value="${fit}" ${merchant && merchant.studentFit === fit ? 'selected' : ''}>${fit}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Branches</label>
                        <input type="number" name="numBranches" min="1"
                               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value="${merchant ? merchant.numBranches : 1}" />
                    </div>
                </div>

                <!-- Location -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">City *</label>
                        <input type="text" name="city" required
                               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value="${merchant ? merchant.city : ''}" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Neighborhood</label>
                        <input type="text" name="neighborhood"
                               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value="${merchant ? merchant.neighborhood : ''}" />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Exact Address</label>
                    <textarea name="exactAddress" rows="2"
                              class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">${merchant ? merchant.exactAddress : ''}</textarea>
                </div>

                <!-- Contact Information -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Main Phone</label>
                        <input type="tel" name="phoneMain"
                               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value="${merchant ? merchant.phoneMain : ''}" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">WhatsApp Business</label>
                        <input type="tel" name="whatsappBusiness"
                               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value="${merchant ? merchant.whatsappBusiness : ''}" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="emailMain"
                               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value="${merchant ? merchant.emailMain : ''}" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Website</label>
                        <input type="url" name="website"
                               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value="${merchant ? merchant.website : ''}" />
                    </div>
                </div>

                <!-- Business Hours -->
                <div>
                    <label class="block text-sm font-medium text-gray-700">Opening Hours</label>
                    <input type="text" name="openingHours" placeholder="e.g., 9:00 AM - 10:00 PM"
                           class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                           value="${merchant ? merchant.openingHours : ''}" />
                </div>

                <!-- Services -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Available Services</label>
                    <div class="flex space-x-4">
                        <label class="flex items-center">
                            <input type="checkbox" name="deliveryAvailable" ${merchant && merchant.deliveryAvailable ? 'checked' : ''}
                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span class="ml-2 text-sm text-gray-700">Delivery</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="dineIn" ${merchant && merchant.dineIn ? 'checked' : ''}
                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span class="ml-2 text-sm text-gray-700">Dine-in</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="takeAway" ${merchant && merchant.takeAway ? 'checked' : ''}
                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span class="ml-2 text-sm text-gray-700">Take-away</span>
                        </label>
                    </div>
                </div>
            </form>
        `;
    }

    saveMerchant(modalId, merchantId = null) {
        const form = document.getElementById('merchantForm');
        const validation = Utils.validateForm(form);
        
        if (!validation.isValid) {
            Utils.showNotification('Please fix the validation errors', 'error');
            return;
        }

        const formData = new FormData(form);
        const currentUser = window.auth.getCurrentUser();
        
        const merchantData = {
            merchantName: formData.get('merchantName'),
            legalName: formData.get('legalName') || formData.get('merchantName'),
            brandAliases: [formData.get('merchantName')],
            category: formData.get('category'),
            genre: formData.get('genre') || '',
            pricingTier: formData.get('pricingTier') || 'Mid',
            studentFit: formData.get('studentFit') || 'Medium',
            city: formData.get('city'),
            neighborhood: formData.get('neighborhood') || '',
            exactAddress: formData.get('exactAddress') || '',
            googleMapsLink: '',
            lat: null,
            lng: null,
            numBranches: parseInt(formData.get('numBranches')) || 1,
            deliveryAvailable: formData.get('deliveryAvailable') === 'on',
            dineIn: formData.get('dineIn') === 'on',
            takeAway: formData.get('takeAway') === 'on',
            openingHours: formData.get('openingHours') || '',
            busyHours: '',
            ownerPartner: currentUser.name,
            website: formData.get('website') || '',
            instagram: '',
            tiktok: '',
            phoneMain: formData.get('phoneMain') || '',
            whatsappBusiness: formData.get('whatsappBusiness') || '',
            emailMain: formData.get('emailMain') || '',
            registerNumber: '',
            taxNumber: '',
            kycStatus: 'NotNeeded',
            riskLevel: 'Low',
            contractRequired: false,
            contractVersion: '',
            contractStatus: 'NotSent',
            contractSentAt: null,
            contractSignedAt: null,
            createdBy: currentUser.id,
            isLive: false
        };

        if (merchantId) {
            // Update existing merchant
            window.dataStore.updateItem('merchants', merchantId, merchantData);
            Utils.showNotification('Merchant updated successfully', 'success');
        } else {
            // Create new merchant
            merchantData.id = Utils.generateId('merchant');
            merchantData.createdAt = new Date();
            merchantData.updatedAt = new Date();
            
            window.dataStore.addItem('merchants', merchantData);

            // Create initial pipeline entry
            const pipelineData = {
                id: Utils.generateId('pipeline'),
                merchantId: merchantData.id,
                stage: 'PendingFirstVisit',
                stageSetAt: new Date(),
                responsibleRepId: currentUser.id,
                nextAction: 'Schedule first visit',
                nextActionDue: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                lostReason: null,
                isCurrent: true
            };
            
            window.dataStore.addItem('pipeline', pipelineData);
            
            Utils.showNotification('Merchant created successfully', 'success');
        }

        Utils.closeModal(modalId);
        this.loadMerchants();
    }

    clearFilters() {
        this.filters = {
            search: '',
            category: '',
            stage: '',
            rep: '',
            city: '',
            studentFit: ''
        };

        // Reset form elements
        document.getElementById('merchantSearch').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('stageFilter').value = '';
        document.getElementById('repFilter').value = '';
        document.getElementById('cityFilter').value = '';
        document.getElementById('studentFitFilter').value = '';

        this.loadMerchants();
    }

    toggleSort() {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        this.loadMerchants();
        this.render(); // Re-render to update sort icon
    }

    getRepOptions() {
        const reps = [
            { id: 'rep-001', name: 'Sami Al-Ahmad' },
            { id: 'rep-002', name: 'Layla Hassan' }
        ];
        return reps.map(rep => `<option value="${rep.id}">${rep.name}</option>`).join('');
    }

    getCityOptions() {
        const merchants = window.dataStore.getData('merchants');
        const cities = [...new Set(merchants.map(m => m.city))].sort();
        return cities.map(city => `<option value="${city}">${city}</option>`).join('');
    }
}

// Initialize merchant manager
window.merchantManager = new MerchantManager();