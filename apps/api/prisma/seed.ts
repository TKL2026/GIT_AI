import { Prisma, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PRO_FEATURES, STANDARD_FEATURES, type PlanFeaturesJson } from '@copilote/shared';

const prisma = new PrismaClient();

// "Sur mesure" n'est volontairement pas un Plan ici : prix négocié au cas
// par cas, contact commercial uniquement, pas de checkout self-service.
// Son quota/ses fonctionnalités seront personnalisables sans migration le
// jour venu, puisque PlanFeaturesJson est un JSON libre par ligne de Plan.
const PLANS: { code: string; name: string; price: number; features: PlanFeaturesJson }[] = [
  {
    code: 'standard',
    name: 'Standard',
    price: 10000,
    features: { maxUsers: 5, features: STANDARD_FEATURES, copilotQuota: 500 },
  },
  {
    code: 'pro',
    name: 'Pro',
    price: 20000,
    features: { maxUsers: null, features: PRO_FEATURES, copilotQuota: 1500 },
  },
];

async function seedPlans() {
  for (const plan of PLANS) {
    // PlanFeaturesJson reste un type précis pour les lecteurs (Entitlements,
    // InvitesService...) — Prisma exige une signature d'index pour un Json
    // en entrée, incompatible avec cette précision ; seul le point d'écriture
    // ici a besoin de ce cast, jamais les lecteurs.
    const features = plan.features as unknown as Prisma.InputJsonValue;
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: { name: plan.name, price: plan.price, features },
      create: { ...plan, features, currency: 'XAF', period: 'MONTHLY' },
    });
  }
  console.log(`Seed plans : ${PLANS.map((p) => p.code).join(', ')}`);
}

async function main() {
  await seedPlans();

  const existing = await prisma.organization.findFirst({
    where: { name: 'Boutique Demo' },
  });
  if (existing) {
    console.log('Seed organisation démo déjà appliqué, ignoré.');
    return;
  }

  const organization = await prisma.organization.create({
    data: { name: 'Boutique Demo' },
  });

  const passwordHash = await bcrypt.hash('Password123!', 10);

  await prisma.user.create({
    data: {
      email: 'owner@demo.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Owner',
      role: Role.OWNER,
      organizationId: organization.id,
    },
  });

  await prisma.product.create({
    data: {
      organizationId: organization.id,
      name: 'Riz 25kg',
      sku: 'RIZ-25KG',
      purchasePrice: 12000,
      salePrice: 15000,
    },
  });

  console.log('Seed applied: organization "Boutique Demo" with owner@demo.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
