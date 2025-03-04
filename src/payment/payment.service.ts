import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../core/prisma/prisma.service';
import { LoggerService } from '../core/logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * IMPORTANT: Pour utiliser ce service avec l'envoi d'emails, exécutez ces commandes:
 * npm install --save nodemailer
 * npm install --save-dev @types/nodemailer
 */

// Nous allons utiliser un import dynamique pour nodemailer, ce qui permet de contourner
// les erreurs TypeScript tout en permettant à l'application de fonctionner si nodemailer est installé
interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private emailTemplateFilePath: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {
    // Initialiser Stripe
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_dummy';
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-02-24.acacia',
    });

    // Définir le chemin du template d'email
    this.emailTemplateFilePath = path.join(process.cwd(), 'templates', 'license-email.html');
    
    // S'assurer que le répertoire des templates existe
    this.ensureTemplateDirectoryExists();
  }

  /**
   * S'assure que le répertoire des templates existe et que le template email est présent
   */
  private ensureTemplateDirectoryExists(): void {
    try {
      const templateDir = path.dirname(this.emailTemplateFilePath);
      
      // Créer le répertoire des templates s'il n'existe pas
      if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true });
        this.logger.log(`Répertoire des templates créé: ${templateDir}`);
      }
      
      // Vérifier si le fichier de template existe, sinon le créer
      if (!fs.existsSync(this.emailTemplateFilePath)) {
        const initialTemplate = fs.readFileSync(
          path.join(process.cwd(), 'templates', 'license-email-template.html'), 
          'utf-8'
        );
        fs.writeFileSync(this.emailTemplateFilePath, initialTemplate);
        this.logger.log(`Template d'email créé: ${this.emailTemplateFilePath}`);
      }
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification du répertoire des templates: ${error.message}`);
    }
  }

  /**
   * Crée une session de checkout Stripe
   */
  async createCheckoutSession(planId: string, customerEmail: string) {
    const plan = await this.prisma.licensePlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Plan non trouvé');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: plan.name,
              description: plan.description || '',
            },
            unit_amount: Math.round(plan.price * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/cancel`,
      customer_email: customerEmail,
      metadata: {
        planId: plan.id,
        customerName: '', // Le nom pourrait être ajouté si disponible
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  /**
   * Gère les webhooks Stripe
   */
  async handleWebhook(payload: any, signature: string) {
    let event: Stripe.Event;

    try {
      // Utiliser une valeur par défaut pour éviter l'erreur undefined
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || 'whsec_dummy';
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (err) {
      this.logger.error(`Webhook error: ${err.message}`);
      throw new Error(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.processPaymentSuccess(session);
    }

    return { received: true };
  }

  /**
   * Traite un paiement réussi et crée une licence
   */
  private async processPaymentSuccess(session: Stripe.Checkout.Session) {
    // Gérer le cas où metadata peut être null
    if (!session.metadata) {
      this.logger.error('Les métadonnées de session sont manquantes');
      return;
    }

    const planId = session.metadata.planId;
    const customerEmail = session.customer_email || '';
    const customerName = session.metadata.customerName || 'Client';

    if (!planId) {
      this.logger.error('PlanId manquant dans les métadonnées');
      return;
    }

    // Créer une nouvelle licence pour ce client
    const plan = await this.prisma.licensePlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      this.logger.error(`Plan non trouvé: ${planId}`);
      return;
    }

    // Calculer la date d'expiration (1 an par défaut)
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    // Générer une clé de licence
    const { generateLicenseKey } = await import('../core/utils/license/generator');
    const key = await generateLicenseKey(plan.identifier);

    // Convertir le customer en string si nécessaire
    let customerId: string | null = null;
    if (typeof session.customer === 'string') {
      customerId = session.customer;
    } else if (session.customer && typeof session.customer === 'object' && 'id' in session.customer) {
      customerId = session.customer.id;
    }

    // Créer la licence
    const license = await this.prisma.license.create({
      data: {
        key,
        planId: plan.id,
        status: 'ACTIVE',
        expirationDate,
        customerId: customerId,
        metadata: {
          stripeSessionId: session.id,
          customerEmail: customerEmail || 'unknown',
          customerName: customerName,
          paymentDate: new Date().toISOString(),
        },
        tokensRemaining: plan.tokens,
      },
      include: {
        plan: true,
      },
    });

    this.logger.log(`Licence créée après paiement: ${license.key} pour ${customerEmail || 'inconnu'}`);

    // Envoyer un email avec la licence
    await this.sendLicenseEmail(license, customerEmail, customerName);
  }

  /**
   * Envoie un email avec la clé de licence au client
   */
  private async sendLicenseEmail(license: any, customerEmail: string, customerName: string): Promise<void> {
    if (!customerEmail) {
      this.logger.error('Impossible d\'envoyer l\'email: adresse email manquante');
      return;
    }

    try {
      // Importer nodemailer dynamiquement
      let nodemailer;
      try {
        nodemailer = await import('nodemailer');
      } catch (importError) {
        this.logger.error(`Nodemailer n'est pas installé. Exécutez 'npm install --save nodemailer'.`);
        // Enregistrer dans un fichier local comme solution de secours
        this.saveEmailToFile(license, customerEmail, customerName);
        return;
      }

      // Vérifier si les paramètres SMTP sont configurés
      const smtpHost = this.configService.get<string>('SMTP_HOST');
      const smtpPort = this.configService.get<number>('SMTP_PORT');
      const smtpUser = this.configService.get<string>('SMTP_USER');
      const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');
      
      if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
        this.logger.warn('Configuration SMTP incomplète. Enregistrement de l\'email dans un fichier local.');
        this.saveEmailToFile(license, customerEmail, customerName);
        return;
      }

      // Créer un transporteur SMTP
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: this.configService.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      // Vérifier si le template existe
      if (!fs.existsSync(this.emailTemplateFilePath)) {
        this.logger.error(`Template d'email non trouvé: ${this.emailTemplateFilePath}`);
        return;
      }

      // Lire le template
      let template = fs.readFileSync(this.emailTemplateFilePath, 'utf-8');

      // Préparer les données pour remplacer dans le template
      const expirationDate = license.expirationDate.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const currentYear = new Date().getFullYear().toString();
      const documentationUrl = this.configService.get('DOCUMENTATION_URL') || 'https://docs.getmefixed.com';

      // Remplacer les variables dans le template
      template = template
        .replace(/{{customerName}}/g, customerName)
        .replace(/{{customerEmail}}/g, customerEmail)
        .replace(/{{licenseKey}}/g, license.key)
        .replace(/{{planName}}/g, license.plan.name)
        .replace(/{{tokens}}/g, license.tokensRemaining.toString())
        .replace(/{{expirationDate}}/g, expirationDate)
        .replace(/{{documentationUrl}}/g, documentationUrl)
        .replace(/{{currentYear}}/g, currentYear);

      // Préparer les options d'email
      const mailOptions: MailOptions = {
        from: this.configService.get('EMAIL_FROM') || '"GetMeFixed" <noreply@getmefixed.com>',
        to: customerEmail,
        subject: 'Votre licence GetMeFixed',
        html: template,
        text: `Merci pour votre achat! Votre clé de licence est: ${license.key}. Plan: ${license.plan.name}, Jetons: ${license.tokensRemaining}, Expiration: ${expirationDate}. L'équipe GetMeFixed.`,
      };

      // Envoyer l'email
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`Email de licence envoyé à ${customerEmail}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email: ${error.message}`);
      
      // En cas d'erreur, enregistrer dans un fichier local
      this.saveEmailToFile(license, customerEmail, customerName);
    }
  }

  /**
   * Sauvegarde l'email dans un fichier local (solution de secours)
   */
  private saveEmailToFile(license: any, customerEmail: string, customerName: string): void {
    try {
      // Créer le répertoire emails s'il n'existe pas
      const emailsDir = path.join(process.cwd(), 'emails');
      if (!fs.existsSync(emailsDir)) {
        fs.mkdirSync(emailsDir, { recursive: true });
      }

      // Lire le template ou utiliser un HTML basique si non disponible
      let emailContent: string;
      try {
        if (fs.existsSync(this.emailTemplateFilePath)) {
          let template = fs.readFileSync(this.emailTemplateFilePath, 'utf-8');
          
          // Préparer les données
          const expirationDate = license.expirationDate.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          
          const currentYear = new Date().getFullYear().toString();
          const documentationUrl = this.configService.get('DOCUMENTATION_URL') || 'https://docs.getmefixed.com';

          // Remplacer les variables dans le template
          emailContent = template
            .replace(/{{customerName}}/g, customerName)
            .replace(/{{customerEmail}}/g, customerEmail)
            .replace(/{{licenseKey}}/g, license.key)
            .replace(/{{planName}}/g, license.plan.name)
            .replace(/{{tokens}}/g, license.tokensRemaining.toString())
            .replace(/{{expirationDate}}/g, expirationDate)
            .replace(/{{documentationUrl}}/g, documentationUrl)
            .replace(/{{currentYear}}/g, currentYear);
        } else {
          // Template de secours simple
          const expirationDate = license.expirationDate.toLocaleDateString('fr-FR');
          emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Votre licence GetMeFixed</title>
</head>
<body>
  <h1>GetMeFixed</h1>
  <h2>Votre licence</h2>
  <p>Cher(e) ${customerName},</p>
  <p>Voici votre clé de licence: <strong>${license.key}</strong></p>
  <p>Plan: ${license.plan.name}</p>
  <p>Jetons: ${license.tokensRemaining}</p>
  <p>Expiration: ${expirationDate}</p>
  <p>Cordialement,<br>L'équipe GetMeFixed</p>
</body>
</html>`;
        }
      } catch (templateError) {
        // En cas d'erreur avec le template, utiliser un contenu très simple
        emailContent = `
<!DOCTYPE html>
<html>
<body>
  <h1>GetMeFixed - Votre licence</h1>
  <p>Clé: ${license.key}</p>
  <p>Plan: ${license.plan.name}</p>
</body>
</html>`;
      }

      // Créer un nom de fichier unique
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `license-email-${license.key}-${timestamp}.html`;
      const filePath = path.join(emailsDir, filename);

      // Écrire le contenu dans le fichier
      fs.writeFileSync(filePath, emailContent);
      
      this.logger.log(`Email de licence enregistré dans: ${filePath}`);
    } catch (error) {
      this.logger.error(`Erreur lors de l'enregistrement de l'email: ${error.message}`);
    }
  }
}