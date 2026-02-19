import { db } from './db.js';
import { plans } from './schema.js';

export const seedPlans = async () => {
  console.log('🌱 Seeding plans...');
  
  const basicPlans = [
    {
      id: 'plan_free',
      code: 'FREE',
      name: 'Free Plan',
      description: '기본 에너지 분석 및 데일리 가이드 제공',
      priceCents: 0,
      currency: 'KRW',
      interval: 'month',
      isActive: true,
      features: { saju_analysis: true, daily_guide: true, forecast_30d: false },
    },
    {
      id: 'plan_pro_monthly',
      code: 'PRO_MONTHLY',
      name: 'Pro Plan (Monthly)',
      description: '심층 사주 분석 및 모든 가이드 무제한 제공',
      priceCents: 990000,
      currency: 'KRW',
      interval: 'month',
      isActive: true,
      features: { saju_analysis: true, daily_guide: true, forecast_30d: true, deep_analysis: true },
    }
  ];

  for (const plan of basicPlans) {
    await db.insert(plans)
      .values(plan)
      .onConflictDoUpdate({
        target: plans.id,
        set: {
          name: plan.name,
          description: plan.description,
          priceCents: plan.priceCents,
          features: plan.features,
          isActive: plan.isActive
        }
      });
  }
  
  console.log('✅ Plans seeded.');
};
