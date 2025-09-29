// Sample Data Store
class DataStore {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        // Initialize with sample data if not exists
        if (!localStorage.getItem('teenCRM_merchants')) {
            this.loadSampleData();
        }
    }

    loadSampleData() {
        // Sample Merchants Data
        const merchants = [
            {
                id: 'merchant-001',
                merchantName: 'Ka3kawi Restaurant',
                legalName: 'Ka3kawi Food Services LLC',
                brandAliases: ['Ka3kawi', 'Ka3kawi Amman'],
                category: 'Food',
                genre: 'Middle Eastern',
                pricingTier: 'Mid',
                studentFit: 'Strong',
                city: 'Amman',
                neighborhood: 'Rainbow Street',
                exactAddress: 'Rainbow Street 15, Jabal Amman',
                googleMapsLink: 'https://maps.google.com/?q=Ka3kawi+Restaurant+Amman',
                lat: 31.9539,
                lng: 35.9106,
                numBranches: 2,
                deliveryAvailable: true,
                dineIn: true,
                takeAway: true,
                openingHours: '10:00 AM - 11:00 PM',
                busyHours: '7:00 PM - 10:00 PM',
                ownerPartner: 'Direct Lead',
                website: 'https://ka3kawi.com',
                instagram: '@ka3kawi_restaurant',
                tiktok: '@ka3kawi_food',
                phoneMain: '+962 6 461 5555',
                whatsappBusiness: '+962 79 123 4567',
                emailMain: 'info@ka3kawi.com',
                registerNumber: 'REG-2020-001',
                taxNumber: 'TAX-123456789',
                kycStatus: 'Verified',
                riskLevel: 'Low',
                contractRequired: true,
                contractVersion: 'V2.1',
                contractStatus: 'Signed',
                contractSentAt: new Date('2024-09-15'),
                contractSignedAt: new Date('2024-09-18'),
                createdAt: new Date('2024-09-10'),
                createdBy: 'rep-001',
                updatedAt: new Date('2024-09-28'),
                isLive: true
            },
            {
                id: 'merchant-002',
                merchantName: 'Base Padel Club',
                legalName: 'Base Sports Complex LLC',
                brandAliases: ['Base Padel', 'Base Sports'],
                category: 'Sports',
                genre: 'Padel',
                pricingTier: 'Premium',
                studentFit: 'Medium',
                city: 'Amman',
                neighborhood: 'Abdoun',
                exactAddress: 'Abdoun Bridge, Sports City',
                googleMapsLink: 'https://maps.google.com/?q=Base+Padel+Club+Amman',
                lat: 31.9341,
                lng: 35.9267,
                numBranches: 1,
                deliveryAvailable: false,
                dineIn: false,
                takeAway: false,
                openingHours: '6:00 AM - 11:00 PM',
                busyHours: '5:00 PM - 9:00 PM',
                ownerPartner: 'Sami Al-Ahmad',
                website: 'https://basepadel.jo',
                instagram: '@base_padel_jo',
                tiktok: '',
                phoneMain: '+962 6 593 7777',
                whatsappBusiness: '+962 79 234 5678',
                emailMain: 'bookings@basepadel.jo',
                registerNumber: 'REG-2023-045',
                taxNumber: 'TAX-987654321',
                kycStatus: 'Verified',
                riskLevel: 'Low',
                contractRequired: true,
                contractVersion: 'V2.1',
                contractStatus: 'Signed',
                contractSentAt: new Date('2024-08-20'),
                contractSignedAt: new Date('2024-08-25'),
                createdAt: new Date('2024-08-15'),
                createdBy: 'rep-001',
                updatedAt: new Date('2024-09-28'),
                isLive: true
            },
            {
                id: 'merchant-003',
                merchantName: 'Bun Fellows Coffee',
                legalName: 'Bun Fellows Café LLC',
                brandAliases: ['Bun Fellows', 'BF Coffee'],
                category: 'Desserts & Coffee',
                genre: 'Coffee',
                pricingTier: 'Mid',
                studentFit: 'Strong',
                city: 'Amman',
                neighborhood: 'Sweifieh',
                exactAddress: 'Sweifieh Mall, Ground Floor',
                googleMapsLink: 'https://maps.google.com/?q=Bun+Fellows+Sweifieh',
                lat: 31.9394,
                lng: 35.8728,
                numBranches: 3,
                deliveryAvailable: true,
                dineIn: true,
                takeAway: true,
                openingHours: '7:00 AM - 12:00 AM',
                busyHours: '8:00 AM - 10:00 AM, 2:00 PM - 4:00 PM',
                ownerPartner: 'Instagram Lead',
                website: 'https://bunfellows.com',
                instagram: '@bunfellows',
                tiktok: '@bunfellows_coffee',
                phoneMain: '+962 6 583 2222',
                whatsappBusiness: '+962 79 345 6789',
                emailMain: 'hello@bunfellows.com',
                registerNumber: 'REG-2022-089',
                taxNumber: 'TAX-456789123',
                kycStatus: 'Pending',
                riskLevel: 'Low',
                contractRequired: true,
                contractVersion: 'V2.1',
                contractStatus: 'Sent',
                contractSentAt: new Date('2024-09-25'),
                contractSignedAt: null,
                createdAt: new Date('2024-09-20'),
                createdBy: 'rep-002',
                updatedAt: new Date('2024-09-28'),
                isLive: false
            },
            {
                id: 'merchant-004',
                merchantName: 'Glow Beauty Salon',
                legalName: 'Glow Beauty Services LLC',
                brandAliases: ['Glow Salon', 'Glow Beauty'],
                category: 'Beauty',
                genre: 'Hair & Beauty',
                pricingTier: 'Premium',
                studentFit: 'Medium',
                city: 'Amman',
                neighborhood: 'Abdoun',
                exactAddress: 'Abdoun Circle, Beauty Plaza',
                googleMapsLink: 'https://maps.google.com/?q=Glow+Beauty+Salon+Abdoun',
                lat: 31.9299,
                lng: 35.9239,
                numBranches: 1,
                deliveryAvailable: false,
                dineIn: false,
                takeAway: false,
                openingHours: '9:00 AM - 8:00 PM',
                busyHours: '4:00 PM - 7:00 PM',
                ownerPartner: 'Layla Hassan',
                website: '',
                instagram: '@glow_beauty_jo',
                tiktok: '',
                phoneMain: '+962 6 592 3333',
                whatsappBusiness: '+962 79 456 7890',
                emailMain: 'appointments@glowbeauty.jo',
                registerNumber: 'REG-2023-112',
                taxNumber: 'TAX-789123456',
                kycStatus: 'NotNeeded',
                riskLevel: 'Low',
                contractRequired: false,
                contractVersion: '',
                contractStatus: 'NotSent',
                contractSentAt: null,
                contractSignedAt: null,
                createdAt: new Date('2024-09-22'),
                createdBy: 'rep-002',
                updatedAt: new Date('2024-09-28'),
                isLive: false
            },
            {
                id: 'merchant-005',
                merchantName: 'Tech Repair Shop',
                legalName: 'Advanced Tech Solutions LLC',
                brandAliases: ['Tech Repair', 'ATS'],
                category: 'Electronics',
                genre: 'Phone Repair',
                pricingTier: 'Budget',
                studentFit: 'Strong',
                city: 'Amman',
                neighborhood: 'University Street',
                exactAddress: 'University Street 25, Near JU',
                googleMapsLink: 'https://maps.google.com/?q=Tech+Repair+Shop+JU',
                lat: 31.9991,
                lng: 35.8713,
                numBranches: 1,
                deliveryAvailable: false,
                dineIn: false,
                takeAway: false,
                openingHours: '9:00 AM - 9:00 PM',
                busyHours: '12:00 PM - 3:00 PM',
                ownerPartner: 'University Partnership',
                website: '',
                instagram: '@techrepair_jo',
                tiktok: '',
                phoneMain: '+962 6 534 4444',
                whatsappBusiness: '+962 79 567 8901',
                emailMain: 'service@techrepair.jo',
                registerNumber: 'REG-2024-003',
                taxNumber: 'TAX-321654987',
                kycStatus: 'Pending',
                riskLevel: 'Medium',
                contractRequired: true,
                contractVersion: 'V2.0',
                contractStatus: 'NotSent',
                contractSentAt: null,
                contractSignedAt: null,
                createdAt: new Date('2024-09-25'),
                createdBy: 'rep-001',
                updatedAt: new Date('2024-09-28'),
                isLive: false
            }
        ];

        // Sample Pipeline Data
        const pipeline = [
            {
                id: 'pipeline-001',
                merchantId: 'merchant-001',
                stage: 'Won',
                stageSetAt: new Date('2024-09-18'),
                responsibleRepId: 'rep-001',
                nextAction: 'Move to onboarding',
                nextActionDue: new Date('2024-09-20'),
                lostReason: null,
                isCurrent: true
            },
            {
                id: 'pipeline-002',
                merchantId: 'merchant-002',
                stage: 'Won',
                stageSetAt: new Date('2024-08-25'),
                responsibleRepId: 'rep-001',
                nextAction: 'Complete onboarding',
                nextActionDue: new Date('2024-08-30'),
                lostReason: null,
                isCurrent: true
            },
            {
                id: 'pipeline-003',
                merchantId: 'merchant-003',
                stage: 'ContractSent',
                stageSetAt: new Date('2024-09-25'),
                responsibleRepId: 'rep-002',
                nextAction: 'Follow up on contract signing',
                nextActionDue: new Date('2024-09-30'),
                lostReason: null,
                isCurrent: true
            },
            {
                id: 'pipeline-004',
                merchantId: 'merchant-004',
                stage: 'FollowUpNeeded',
                stageSetAt: new Date('2024-09-22'),
                responsibleRepId: 'rep-002',
                nextAction: 'Schedule demo meeting',
                nextActionDue: new Date('2024-09-27'),
                lostReason: null,
                isCurrent: true
            },
            {
                id: 'pipeline-005',
                merchantId: 'merchant-005',
                stage: 'PendingFirstVisit',
                stageSetAt: new Date('2024-09-25'),
                responsibleRepId: 'rep-001',
                nextAction: 'Schedule first visit',
                nextActionDue: new Date('2024-09-29'),
                lostReason: null,
                isCurrent: true
            }
        ];

        // Sample Onboarding Data
        const onboarding = [
            {
                id: 'onboard-001',
                merchantId: 'merchant-001',
                assignedRepId: 'rep-001',
                contactName: 'Ahmad Ka3kawi',
                contactNumber: '+962 79 123 4567',
                locationLabel: 'Rainbow Street Main Branch',
                surveyFilled: true,
                teenStaffInstalled: true,
                credentialsSent: true,
                trainingDone: true,
                offersAdded: true,
                offersCount: 3,
                branchesCovered: true,
                assetsComplete: true,
                readyForQa: true,
                live: true,
                liveDate: new Date('2024-09-20'),
                qaNotes: 'All requirements met. Live status approved.',
                updatedAt: new Date('2024-09-20')
            },
            {
                id: 'onboard-002',
                merchantId: 'merchant-002',
                assignedRepId: 'rep-001',
                contactName: 'Omar Basem',
                contactNumber: '+962 79 234 5678',
                locationLabel: 'Abdoun Main Court',
                surveyFilled: true,
                teenStaffInstalled: true,
                credentialsSent: true,
                trainingDone: true,
                offersAdded: true,
                offersCount: 2,
                branchesCovered: true,
                assetsComplete: true,
                readyForQa: true,
                live: true,
                liveDate: new Date('2024-08-30'),
                qaNotes: 'Perfect setup. All courts operational.',
                updatedAt: new Date('2024-08-30')
            }
        ];

        // Sample Activities Data
        const activities = [
            {
                id: 'activity-001',
                merchantId: 'merchant-001',
                repId: 'rep-001',
                type: 'Meeting',
                summary: 'Initial demo meeting with owner. Showed app features and discussed pricing. Very interested in student offers.',
                occurredAt: new Date('2024-09-10'),
                attachmentUrl: null
            },
            {
                id: 'activity-002',
                merchantId: 'merchant-001',
                repId: 'rep-001',
                type: 'Call',
                summary: 'Follow-up call to discuss contract terms. Agreed on pricing tier and payment schedule.',
                occurredAt: new Date('2024-09-15'),
                attachmentUrl: null
            },
            {
                id: 'activity-003',
                merchantId: 'merchant-002',
                repId: 'rep-001',
                type: 'Training',
                summary: 'On-site training session for staff. Covered booking system, offer management, and customer service.',
                occurredAt: new Date('2024-08-28'),
                attachmentUrl: null
            },
            {
                id: 'activity-004',
                merchantId: 'merchant-003',
                repId: 'rep-002',
                type: 'WhatsApp',
                summary: 'Sent contract via WhatsApp. Explained terms and answered questions about commission structure.',
                occurredAt: new Date('2024-09-25'),
                attachmentUrl: null
            },
            {
                id: 'activity-005',
                merchantId: 'merchant-004',
                repId: 'rep-002',
                type: 'Meeting',
                summary: 'Site visit and demo. Owner impressed with app interface. Needs to discuss with business partner.',
                occurredAt: new Date('2024-09-22'),
                attachmentUrl: null
            }
        ];

        // Sample Payouts Data
        const payouts = [
            {
                id: 'payout-001',
                merchantId: 'merchant-001',
                repId: 'rep-001',
                amountJod: 9,
                reason: 'WonBonus',
                createdAt: new Date('2024-09-18')
            },
            {
                id: 'payout-002',
                merchantId: 'merchant-001',
                repId: 'rep-001',
                amountJod: 7,
                reason: 'FullyOnboardedBonus',
                createdAt: new Date('2024-09-20')
            },
            {
                id: 'payout-003',
                merchantId: 'merchant-002',
                repId: 'rep-001',
                amountJod: 9,
                reason: 'WonBonus',
                createdAt: new Date('2024-08-25')
            },
            {
                id: 'payout-004',
                merchantId: 'merchant-002',
                repId: 'rep-001',
                amountJod: 7,
                reason: 'FullyOnboardedBonus',
                createdAt: new Date('2024-08-30')
            }
        ];

        // Save sample data to localStorage
        localStorage.setItem('teenCRM_merchants', JSON.stringify(merchants));
        localStorage.setItem('teenCRM_pipeline', JSON.stringify(pipeline));
        localStorage.setItem('teenCRM_onboarding', JSON.stringify(onboarding));
        localStorage.setItem('teenCRM_activities', JSON.stringify(activities));
        localStorage.setItem('teenCRM_payouts', JSON.stringify(payouts));
    }

    // Generic CRUD operations
    getData(table) {
        const data = localStorage.getItem(`teenCRM_${table}`);
        return data ? JSON.parse(data) : [];
    }

    saveData(table, data) {
        localStorage.setItem(`teenCRM_${table}`, JSON.stringify(data));
    }

    addItem(table, item) {
        const data = this.getData(table);
        data.push(item);
        this.saveData(table, data);
        return item;
    }

    updateItem(table, id, updates) {
        const data = this.getData(table);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates, updatedAt: new Date() };
            this.saveData(table, data);
            return data[index];
        }
        return null;
    }

    deleteItem(table, id) {
        const data = this.getData(table);
        const filteredData = data.filter(item => item.id !== id);
        this.saveData(table, filteredData);
        return true;
    }

    findItem(table, id) {
        const data = this.getData(table);
        return data.find(item => item.id === id);
    }

    generateId(prefix = 'item') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Specific business logic methods
    getMerchantsForUser(userId, role) {
        const merchants = this.getData('merchants');
        
        if (role === 'Admin') {
            return merchants; // Admin sees all merchants
        }
        
        if (role === 'Rep') {
            // Rep sees merchants they created or are assigned to
            return merchants.filter(merchant => {
                const pipeline = this.getCurrentPipeline(merchant.id);
                const onboarding = this.getOnboarding(merchant.id);
                
                return merchant.createdBy === userId || 
                       (pipeline && pipeline.responsibleRepId === userId) ||
                       (onboarding && onboarding.assignedRepId === userId);
            });
        }
        
        return [];
    }

    getCurrentPipeline(merchantId) {
        const pipelines = this.getData('pipeline');
        return pipelines.find(p => p.merchantId === merchantId && p.isCurrent);
    }

    getOnboarding(merchantId) {
        const onboardings = this.getData('onboarding');
        return onboardings.find(o => o.merchantId === merchantId);
    }

    getActivitiesForMerchant(merchantId) {
        const activities = this.getData('activities');
        return activities
            .filter(a => a.merchantId === merchantId)
            .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
    }

    getPayoutsForUser(userId) {
        const payouts = this.getData('payouts');
        return payouts.filter(p => p.repId === userId);
    }

    // Pipeline state machine
    canTransitionStage(currentStage, newStage) {
        const validTransitions = {
            'PendingFirstVisit': ['FollowUpNeeded', 'Rejected'],
            'FollowUpNeeded': ['ContractSent', 'Rejected'],
            'ContractSent': ['Won', 'Rejected'],
            'Won': [], // Won merchants move to onboarding, not pipeline
            'Rejected': [] // Terminal state
        };

        return validTransitions[currentStage]?.includes(newStage) || false;
    }

    transitionPipelineStage(merchantId, newStage, lostReason = null) {
        const pipeline = this.getCurrentPipeline(merchantId);
        if (!pipeline) return null;

        if (!this.canTransitionStage(pipeline.stage, newStage)) {
            throw new Error(`Invalid transition from ${pipeline.stage} to ${newStage}`);
        }

        // Update current pipeline record
        const updatedPipeline = this.updateItem('pipeline', pipeline.id, {
            stage: newStage,
            stageSetAt: new Date(),
            lostReason: lostReason
        });

        // If moving to Won stage, create onboarding record and payout
        if (newStage === 'Won') {
            this.handleWonTransition(merchantId, pipeline.responsibleRepId);
        }

        return updatedPipeline;
    }

    handleWonTransition(merchantId, repId) {
        // Create onboarding record if doesn't exist
        let onboarding = this.getOnboarding(merchantId);
        if (!onboarding) {
            onboarding = {
                id: this.generateId('onboard'),
                merchantId,
                assignedRepId: repId,
                contactName: '',
                contactNumber: '',
                locationLabel: '',
                surveyFilled: false,
                teenStaffInstalled: false,
                credentialsSent: false,
                trainingDone: false,
                offersAdded: false,
                offersCount: 0,
                branchesCovered: false,
                assetsComplete: false,
                readyForQa: false,
                live: false,
                liveDate: null,
                qaNotes: '',
                updatedAt: new Date()
            };
            this.addItem('onboarding', onboarding);
        }

        // Create Won payout (only once per merchant)
        const existingWonPayout = this.getData('payouts')
            .find(p => p.merchantId === merchantId && p.reason === 'WonBonus');
        
        if (!existingWonPayout) {
            const payout = {
                id: this.generateId('payout'),
                merchantId,
                repId,
                amountJod: 9,
                reason: 'WonBonus',
                createdAt: new Date()
            };
            this.addItem('payouts', payout);
        }
    }

    // Onboarding validation
    canGoLive(onboarding) {
        return onboarding.surveyFilled &&
               onboarding.offersAdded &&
               onboarding.offersCount >= 1 &&
               onboarding.branchesCovered &&
               onboarding.assetsComplete;
    }

    setMerchantLive(merchantId) {
        const onboarding = this.getOnboarding(merchantId);
        if (!onboarding) {
            throw new Error('No onboarding record found');
        }

        if (!this.canGoLive(onboarding)) {
            throw new Error('Cannot go live: missing requirements');
        }

        // Update onboarding to live
        const updatedOnboarding = this.updateItem('onboarding', onboarding.id, {
            live: true,
            liveDate: new Date()
        });

        // Update merchant live status
        this.updateItem('merchants', merchantId, { isLive: true });

        // Create Live payout (only once per merchant)
        const existingLivePayout = this.getData('payouts')
            .find(p => p.merchantId === merchantId && p.reason === 'FullyOnboardedBonus');
        
        if (!existingLivePayout) {
            const payout = {
                id: this.generateId('payout'),
                merchantId,
                repId: onboarding.assignedRepId,
                amountJod: 7,
                reason: 'FullyOnboardedBonus',
                createdAt: new Date()
            };
            this.addItem('payouts', payout);
        }

        return updatedOnboarding;
    }
}

// Initialize data store
window.dataStore = new DataStore();