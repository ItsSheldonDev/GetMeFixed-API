import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@getmefixed.com' },
    update: {},
    create: {
      email: 'admin@getmefixed.com',
      password: hashedPassword,
    },
  });

  console.log('Created admin:', admin.email);

  // Création des plans de licence par défaut
  const plans = [
    {
      name: 'Basic',
      identifier: 'BSC',
      tokens: 100,
      description: 'Basic license plan',
      price: 9.99,
    },
    {
      name: 'Professional',
      identifier: 'PRO',
      tokens: 500,
      description: 'Professional license plan',
      price: 29.99,
    },
    {
      name: 'Enterprise',
      identifier: 'ENT',
      tokens: 2000,
      description: 'Enterprise license plan',
      price: 99.99,
    },
  ];

  for (const plan of plans) {
    await prisma.licensePlan.upsert({
      where: { identifier: plan.identifier },
      update: {},
      create: plan,
    });
    console.log('Created license plan:', plan.name);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });