// src/scripts/clean-database.ts
import { PrismaClient } from '@prisma/client';
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

async function cleanDatabase() {
  console.clear();
  console.log(chalk.red(`
╔═══════════════════════════════════════╗
║    🧹 GetMeFixed Database Cleaner     ║
║         ⚠️  ATTENTION ⚠️               ║
║    Cette action est irréversible!     ║
╚═══════════════════════════════════════╝
  `));

  const confirmation = await question(chalk.yellow('🚨 Êtes-vous SÛR de vouloir vider la base de données? (oui/NON): '));

  if (confirmation.toLowerCase() !== 'oui') {
    console.log(chalk.green('✅ Opération annulée'));
    await prisma.$disconnect();
    rl.close();
    return;
  }

  console.log(chalk.yellow(`
⚠️  Dernière chance! ⚠️
Cette action va supprimer TOUTES les données!
  `));

  const finalConfirmation = await question(chalk.red('Tapez "SUPPRIMER" pour confirmer: '));

  if (finalConfirmation !== 'SUPPRIMER') {
    console.log(chalk.green('✅ Opération annulée'));
    await prisma.$disconnect();
    rl.close();
    return;
  }

  try {
    console.log(chalk.yellow('🔄 Nettoyage en cours...'));

    // Suppression dans l'ordre pour respecter les contraintes de clés étrangères
    const steps = [
      { name: 'Plugin Licenses', promise: prisma.pluginLicense.deleteMany() },
      { name: 'Plugin Versions', promise: prisma.pluginVersion.deleteMany() },
      { name: 'Plugins', promise: prisma.plugin.deleteMany() },
      { name: 'License Usage', promise: prisma.licenseUsage.deleteMany() },
      { name: 'Licenses', promise: prisma.license.deleteMany() },
      { name: 'License Plans', promise: prisma.licensePlan.deleteMany() },
      { name: 'Admins', promise: prisma.admin.deleteMany() }
    ];

    for (const step of steps) {
      process.stdout.write(chalk.yellow(`🔄 Suppression des ${step.name}...`));
      await step.promise;
      process.stdout.write(chalk.green(' ✅\n'));
    }

    console.log(chalk.green(`
╔═══════════════════════════════════════╗
║    ✨ Base de données nettoyée! ✨    ║
╚═══════════════════════════════════════╝
    `));
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors du nettoyage:'), error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

cleanDatabase();