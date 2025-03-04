// src/scripts/create-test-license.ts
import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';
import chalk from 'chalk';

import { generateLicenseKey } from '../core/utils/license/generator';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function createTestLicense() {
  console.clear();
  console.log(chalk.blue(`
╔═══════════════════════════════════════╗
║   🔑 GetMeFixed Test License Creator  ║
╚═══════════════════════════════════════╝
  `));

  try {
    // Récupérer les plans disponibles
    const plans = await prisma.licensePlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    if (!plans.length) {
      console.log(chalk.red('❌ Aucun plan de licence trouvé. Veuillez créer des plans d\'abord.'));
      return;
    }

    console.log(chalk.cyan('📋 Plans de licence disponibles:'));
    plans.forEach((plan, index) => {
      console.log(chalk.cyan(`  ${index + 1}. ${plan.name} (${plan.identifier}) - ${plan.tokens} tokens - ${plan.price}€`));
    });

    const planIndex = parseInt(await question(chalk.blue('\n🔢 Sélectionnez un plan (numéro): '))) - 1;
    
    if (isNaN(planIndex) || planIndex < 0 || planIndex >= plans.length) {
      console.log(chalk.red('❌ Sélection invalide'));
      return;
    }
    
    const selectedPlan = plans[planIndex];
    
    const customerEmail = await question(chalk.blue('📧 Email du client: '));
    const durationMonths = parseInt(await question(chalk.blue('📅 Durée en mois (défaut: 12): ')) || '12');
    
    // Calculer la date d'expiration
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + durationMonths);
    
    console.log(chalk.yellow('\n🔄 Création de la licence en cours...\n'));

    // Générer la clé de licence
    const key = await generateLicenseKey(selectedPlan.identifier);

    // Créer la licence
    const license = await prisma.license.create({
      data: {
        key,
        planId: selectedPlan.id,
        status: 'ACTIVE',
        expirationDate,
        customerId: customerEmail,
        metadata: {
          customer: customerEmail,
          createdVia: 'test-script',
          createdAt: new Date().toISOString()
        },
        tokensRemaining: selectedPlan.tokens,
      },
      include: {
        plan: true,
      },
    });

    console.log(chalk.green('✅ Licence créée avec succès!'));
    console.log('\n📊 Détails de la licence:');
    console.log(chalk.cyan(`🆔 ID: ${license.id}`));
    console.log(chalk.cyan(`🔑 Clé: ${license.key}`));
    console.log(chalk.cyan(`📝 Plan: ${license.plan.name}`));
    console.log(chalk.cyan(`🧮 Tokens: ${license.tokensRemaining}`));
    console.log(chalk.cyan(`📅 Expiration: ${license.expirationDate.toLocaleDateString()}`));
    
    console.log(chalk.yellow(`
╔═══════════════════════════════════════╗
║       🎉 Licence créée! 🎉            ║
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

createTestLicense();