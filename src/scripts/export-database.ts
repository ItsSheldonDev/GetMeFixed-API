// src/scripts/export-database.ts
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

async function exportDatabase() {
  console.clear();
  console.log(chalk.cyan(`
┌───────────────────────────────────────┐
│     📦 GetMeFixed Database Export     │
└───────────────────────────────────────┘
  `));

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL non définie dans le fichier .env');
    }

    // Extraction des informations de connexion
    const dbUrl = new URL(process.env.DATABASE_URL);
    const database = dbUrl.pathname.slice(1);
    const user = dbUrl.username;
    const password = dbUrl.password;
    const host = dbUrl.hostname;
    const port = dbUrl.port || '5432';

    // Création du dossier backups
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Génération du nom de fichier
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR').replace(/\//g, '-');
    const time = now.toLocaleTimeString('fr-FR').replace(/:/g, '-');
    const filename = `getmefixed_${date}_${time}.dump`;
    const filePath = path.join(backupDir, filename);

    console.log(chalk.yellow('🔄 Export de la base de données en cours...'));

    // Commande pg_dump
    const cmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F c -f "${filePath}"`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`
❌ Erreur lors de l'export:
${error.message}`));
        return;
      }

      if (stderr) {
        console.error(chalk.yellow(`⚠️ Attention: ${stderr}`));
      }

      // Obtenir la taille du fichier
      const stats = fs.statSync(filePath);
      const sizeInMb = (stats.size / (1024 * 1024)).toFixed(2);

      console.log(chalk.green(`
┌───────────────────────────────────────┐
│    ✨ Export terminé avec succès!     │
├───────────────────────────────────────┤
│  📂 Fichier: ${filename}
│  📁 Dossier: ${backupDir}
│  📊 Taille : ${sizeInMb} MB
└───────────────────────────────────────┘
      `));

      // Listing des backups existants
      const files = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.dump'))
        .sort((a, b) => b.localeCompare(a));
      
      if (files.length > 1) {
        console.log(chalk.cyan('\n📚 Derniers backups:'));
        files.slice(0, 5).forEach(backup => {
          const backupStats = fs.statSync(path.join(backupDir, backup));
          const backupSize = (backupStats.size / (1024 * 1024)).toFixed(2);
          console.log(`   - ${backup} (${backupSize} MB)`);
        });
      }
    });
  } catch (error) {
    console.error(chalk.red(`
❌ Erreur inattendue:
${error.message}\n`));
    process.exit(1);
  }
}

exportDatabase();