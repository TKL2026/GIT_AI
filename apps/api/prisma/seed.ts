import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.organization.findFirst({
    where: { name: 'Boutique Demo' },
  });
  if (existing) {
    console.log('Seed already applied, skipping.');
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
