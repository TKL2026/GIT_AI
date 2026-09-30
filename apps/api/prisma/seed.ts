import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// "Sur mesure" n'est volontairement pas un Plan ici : prix négocié au cas
// par cas, contact commercial uniquement, pas de checkout self-service.
const PLANS = [
  { code: 'standard', name: 'Standard', price: 5000, features: { maxUsers: 5 } },
  { code: 'pro', name: 'Pro', price: 10000, features: { maxUsers: null } },
];

async function seedPlans() {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: {},
      create: { ...plan, currency: 'XAF', period: 'MONTHLY' },
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
