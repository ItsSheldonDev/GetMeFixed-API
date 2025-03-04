// src/scripts/create-admin.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';
import chalk from 'chalk';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function createAdmin() {
  console.clear();
  console.log(chalk.cyan(`
╔═══════════════════════════════════════╗
║     🔐 GetMeFixed Admin Creator 🔐    ║
╚═══════════════════════════════════════╝
  `));

  try {
    // Collecte des informations
    const email = await question(chalk.blue('🌐 Email de l\'administrateur: '));
    const password = await question(chalk.blue('🔑 Mot de passe (min 6 caractères): '));

    if (password.length < 6) {
      console.log(chalk.red('❌ Le mot de passe doit contenir au moins 6 caractères'));
      return;
    }

    console.log(chalk.yellow('\n🔄 Création de l\'administrateur en cours...\n'));

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Vérification si l'admin existe déjà
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log(chalk.red('❌ Un administrateur avec cet email existe déjà'));
      return;
    }

    // Création de l'admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Création des plans de licence
    const plans = [
      {
        name: '🌱 Basic',
        identifier: 'BSC',
        tokens: 100,
        description: '✨ Perfect for starting your journey',
        price: 9.99,
      },
      {
        name: '💪 Professional',
        identifier: 'PRO',
        tokens: 500,
        description: '🚀 For growing businesses',
        price: 29.99,
      },
      {
        name: '🏢 Enterprise',
        identifier: 'ENT',
        tokens: 2000,
        description: '🌟 Ultimate power and flexibility',
        price: 99.99,
      },
    ];

    for (const plan of plans) {
      await prisma.licensePlan.upsert({
        where: { identifier: plan.identifier },
        update: {},
        create: plan,
      });
    }

    console.log(chalk.green('✅ Admin créé avec succès!'));
    console.log('\n📊 Détails de l\'administrateur:');
    console.log(chalk.cyan(`🆔 ID: ${admin.id}`));
    console.log(chalk.cyan(`📧 Email: ${admin.email}`));
    console.log(chalk.green('\n✨ Les plans de licence par défaut ont été créés'));
    
    console.log(chalk.yellow(`
╔═══════════════════════════════════════╗
║    🎉 Configuration terminée! 🎉      ║
╚═══════════════════════════════════════╝
    `));

  } catch (error) {
    console.log(chalk.red('❌ Une erreur est survenue'));
    console.error(error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createAdmin();