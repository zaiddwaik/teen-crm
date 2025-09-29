import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seed...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@teen-crm.com' },
      update: {},
      create: {
        email: 'admin@teen-crm.com',
        name: 'System Administrator',
        phone: '+962791234567',
        role: 'ADMIN',
        passwordHash: adminPassword,
        status: 'ACTIVE'
      }
    });

    logger.info(`Admin user created/updated: ${admin.email}`);

    // Create sample sales reps
    const rep1Password = await bcrypt.hash('rep123', 12);
    const rep1 = await prisma.user.upsert({
      where: { email: 'sami@teen-crm.com' },
      update: {},
      create: {
        email: 'sami@teen-crm.com',
        name: 'Sami Al-Ahmad',
        phone: '+962791234568',
        role: 'REP',
        passwordHash: rep1Password,
        status: 'ACTIVE'
      }
    });

    const rep2Password = await bcrypt.hash('rep123', 12);
    const rep2 = await prisma.user.upsert({
      where: { email: 'layla@teen-crm.com' },
      update: {},
      create: {
        email: 'layla@teen-crm.com',
        name: 'Layla Khalil',
        phone: '+962791234569',
        role: 'REP',
        passwordHash: rep2Password,
        status: 'ACTIVE'
      }
    });

    logger.info(`Sales reps created/updated: ${rep1.email}, ${rep2.email}`);

    // Create sample merchants
    const merchants = [
      {
        name: 'Ka3kawi Restaurant',
        category: 'FOOD',
        contactPersonName: 'Ahmad Ka3kawi',
        contactPhone: '+962791111111',
        contactEmail: 'ahmad@ka3kawi.com',
        location: 'Rainbow Street, Amman',
        description: 'Traditional Jordanian cuisine restaurant',
        assignedRepId: rep1.id
      },
      {
        name: 'Base Padel Club',
        category: 'SPORTS',
        contactPersonName: 'Sarah Al-Rashid',
        contactPhone: '+962791111112',
        contactEmail: 'sarah@basepadel.com',
        location: 'Abdoun, Amman',
        description: 'Premium padel tennis club',
        assignedRepId: rep1.id
      },
      {
        name: 'Bun Fellows Coffee',
        category: 'DESSERTS_COFFEE',
        contactPersonName: 'Omar Hijazi',
        contactPhone: '+962791111113',
        contactEmail: 'omar@bunfellows.com',
        location: 'Jabal Al-Weibdeh, Amman',
        description: 'Artisan coffee and pastries',
        assignedRepId: rep2.id
      },
      {
        name: 'Glow Beauty Salon',
        category: 'BEAUTY',
        contactPersonName: 'Nour Al-Zahra',
        contactPhone: '+962791111114',
        contactEmail: 'nour@glowbeauty.com',
        location: 'Sweifieh, Amman',
        description: 'Full-service beauty and wellness salon',
        assignedRepId: rep2.id
      },
      {
        name: 'Tech Repair Shop',
        category: 'ELECTRONICS',
        contactPersonName: 'Khaled Mansour',
        contactPhone: '+962791111115',
        contactEmail: 'khaled@techrepair.com',
        location: 'Downtown, Amman',
        description: 'Mobile and laptop repair services',
        assignedRepId: rep1.id
      }
    ];

    for (const merchantData of merchants) {
      // Create merchant
      const merchant = await prisma.merchant.upsert({
        where: { 
          name_contactPhone: {
            name: merchantData.name,
            contactPhone: merchantData.contactPhone
          }
        },
        update: {},
        create: {
          ...merchantData,
          category: merchantData.category as any,
          createdById: admin.id
        }
      });

      // Create pipeline for each merchant
      const pipelineData = {
        merchantId: merchant.id,
        currentStage: 'PENDING_FIRST_VISIT' as any,
        nextActionDescription: 'Schedule first visit with merchant',
        nextActionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        lastUpdatedById: merchantData.assignedRepId
      };

      // Check different stages for demo
      if (merchant.name === 'Ka3kawi Restaurant' || merchant.name === 'Base Padel Club') {
        pipelineData.currentStage = 'WON';
        pipelineData.nextActionDescription = 'Begin onboarding process';
      } else if (merchant.name === 'Bun Fellows Coffee') {
        pipelineData.currentStage = 'CONTRACT_SENT';
        pipelineData.nextActionDescription = 'Follow up on contract signature';
      } else if (merchant.name === 'Glow Beauty Salon') {
        pipelineData.currentStage = 'FOLLOW_UP_NEEDED';
        pipelineData.nextActionDescription = 'Address pricing concerns';
      }

      const pipeline = await prisma.pipeline.upsert({
        where: { merchantId: merchant.id },
        update: pipelineData,
        create: pipelineData
      });

      // Create stage history
      await prisma.pipelineStageHistory.upsert({
        where: {
          pipelineId_stage: {
            pipelineId: pipeline.id,
            stage: pipelineData.currentStage
          }
        },
        update: {},
        create: {
          pipelineId: pipeline.id,
          stage: pipelineData.currentStage,
          changedById: merchantData.assignedRepId,
          notes: 'Initial stage set during seeding'
        }
      });

      // Create onboarding for Won merchants
      if (pipelineData.currentStage === 'WON') {
        const onboardingStatus = merchant.name === 'Ka3kawi Restaurant' ? 'LIVE' : 'IN_PROGRESS';
        const isLive = onboardingStatus === 'LIVE';

        await prisma.onboarding.upsert({
          where: { merchantId: merchant.id },
          update: {},
          create: {
            merchantId: merchant.id,
            status: onboardingStatus as any,
            surveyFilled: true,
            offersAdded: true,
            branchesCovered: true,
            assetsComplete: isLive,
            qaApproved: isLive,
            completionPercentage: isLive ? 1.0 : 0.75,
            liveDate: isLive ? new Date() : null,
            createdById: admin.id,
            lastUpdatedById: merchantData.assignedRepId
          }
        });

        // Create payouts for Won merchants
        await prisma.payoutLedger.upsert({
          where: {
            merchantId_type_recipientId: {
              merchantId: merchant.id,
              type: 'WON',
              recipientId: merchantData.assignedRepId
            }
          },
          update: {},
          create: {
            merchantId: merchant.id,
            recipientId: merchantData.assignedRepId,
            type: 'WON',
            amount: 9.0,
            description: 'Bonus for merchant reaching Won stage',
            status: 'PAID',
            createdById: admin.id
          }
        });

        // Create live payout for live merchants
        if (isLive) {
          await prisma.payoutLedger.upsert({
            where: {
              merchantId_type_recipientId: {
                merchantId: merchant.id,
                type: 'LIVE',
                recipientId: merchantData.assignedRepId
              }
            },
            update: {},
            create: {
              merchantId: merchant.id,
              recipientId: merchantData.assignedRepId,
              type: 'LIVE',
              amount: 7.0,
              description: 'Bonus for merchant going Live',
              status: 'PAID',
              createdById: admin.id
            }
          });
        }
      }

      // Create sample activities
      const activities = [
        {
          merchantId: merchant.id,
          type: 'CALL',
          summary: 'Initial contact call',
          description: 'Discussed Teen partnership opportunity and benefits',
          outcome: 'POSITIVE',
          duration: 15,
          completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          createdById: merchantData.assignedRepId
        },
        {
          merchantId: merchant.id,
          type: 'MEETING',
          summary: 'In-person meeting at merchant location',
          description: 'Presented detailed proposal and answered questions',
          outcome: 'FOLLOW_UP_NEEDED',
          duration: 45,
          completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          createdById: merchantData.assignedRepId
        }
      ];

      for (const activityData of activities) {
        await prisma.activity.create({
          data: {
            ...activityData,
            type: activityData.type as any,
            outcome: activityData.outcome as any
          }
        });
      }

      logger.info(`Merchant created with pipeline and activities: ${merchant.name}`);
    }

    logger.info('Database seeding completed successfully!');
    logger.info('Demo credentials:');
    logger.info('Admin: admin@teen-crm.com / admin123');
    logger.info('Rep 1: sami@teen-crm.com / rep123');
    logger.info('Rep 2: layla@teen-crm.com / rep123');

  } catch (error) {
    logger.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    logger.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });