// src/scripts/db-status.ts
import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';
const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  console.clear();
  console.log(chalk.cyan(`
┌───────────────────────────────────────┐
│     📊 GetMeFixed Database Status     │
└───────────────────────────────────────┘
  `));

  try {
    console.log(chalk.yellow('🔄 Analyse en cours...\n'));

    // On utilise Promise.all pour paralléliser les requêtes
    const [
      adminsCount,
      plansCount,
      licensesCount,
      pluginsCount,
      versionsCount,
      pluginLicensesCount,
      usagesCount,
      activeLicenses,
      revokedLicenses
    ] = await Promise.all([
      prisma.admin.count(),
      prisma.licensePlan.count(),
      prisma.license.count(),
      prisma.plugin.count(),
      prisma.pluginVersion.count(),
      prisma.pluginLicense.count(),
      prisma.licenseUsage.count(),
      prisma.license.count({ where: { status: 'ACTIVE' } }),
      prisma.license.count({ where: { status: 'REVOKED' } })
    ]);

    // Calcul des statistiques
    const totalEntries = adminsCount + plansCount + licensesCount + 
                        pluginsCount + versionsCount + pluginLicensesCount + 
                        usagesCount;

    const stats = [
      { emoji: '👥', name: 'Administrateurs', count: adminsCount },
      { emoji: '📜', name: 'Plans de licence', count: plansCount },
      { emoji: '🔑', name: 'Licences totales', count: licensesCount },
      { emoji: '✅', name: 'Licences actives', count: activeLicenses },
      { emoji: '❌', name: 'Licences révoquées', count: revokedLicenses },
      { emoji: '🔌', name: 'Plugins', count: pluginsCount },
      { emoji: '📦', name: 'Versions de plugins', count: versionsCount },
      { emoji: '🔗', name: 'Licences de plugins', count: pluginLicensesCount },
      { emoji: '📈', name: 'Actions enregistrées', count: usagesCount }
    ];

    // Affichage des statistiques
    const maxNameLength = Math.max(...stats.map(s => s.name.length));
    
    stats.forEach(({ emoji, name, count }) => {
      const paddedName = name.padEnd(maxNameLength);
      console.log(`${emoji} ${chalk.cyan(paddedName)} : ${chalk.green(count.toString().padStart(5))}`);
    });

    // Affichage du total
    console.log('\n' + '─'.repeat(40));
    console.log(`📊 ${chalk.cyan('Total des entrées')} : ${chalk.green(totalEntries)}\n`);

    // Si la base est vide, afficher un message spécial
    if (totalEntries === 0) {
      console.log(chalk.yellow(`
⚠️  La base de données est vide!
💡 Utilisez 'npm run seed:admin' pour créer un administrateur
   et les plans de licence par défaut.\n`));
    }

  } catch (error) {
    console.error(chalk.red(`
❌ Erreur lors de l'analyse de la base de données:
${error}\n`));
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus();