import { NestFactory } from '@nestjs/core';
import { ValidationPipe, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import helmet from 'helmet';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as figlet from 'figlet';
import { AppModule } from './app.module';
import { LoggerService } from './core/logger/logger.service';
import { PrismaService } from './core/prisma/prisma.service';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';

class SimpleLoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const now = Date.now();
    
    this.logger.log(`Request: ${method} ${url}`);
    
    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        this.logger.log(`Response: ${method} ${url} - ${delay}ms`);
      })
    );
  }
}

/**
 * Affiche une bannière ASCII art au démarrage
 */
function displayBanner(logger: LoggerService, port: number, enableSwagger: boolean) {
  try {
    // Générer l'ASCII art
    const banner = figlet.textSync('GetMeFixed API', {
      font: 'Big',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80,
    });

    // Ajouter des couleurs ANSI (fonctionne dans la plupart des terminaux)
    const coloredBanner = `\x1b[36m${banner}\x1b[0m`;
    
    // Afficher la bannière et les informations
    console.log(coloredBanner);
    console.log('\x1b[33m=================================================\x1b[0m');
    logger.log('🚀 GetMeFixed API démarrée avec succès!');
    logger.log(`🌐 URL de l'API: http://localhost:${port}/api/v1`);
    
    if (enableSwagger) {
      logger.log(`📚 Documentation Swagger: http://localhost:${port}/api/docs`);
    }
    
    const nodeEnv = process.env.NODE_ENV || 'development';
    logger.log(`🔧 Environnement: ${nodeEnv}`);
    
    logger.log('✅ Prêt à traiter les requêtes');
    console.log('\x1b[33m=================================================\x1b[0m');
  } catch (error) {
    // Si figlet n'est pas disponible, utiliser un affichage simple
    logger.log('🚀 GetMeFixed API démarrée avec succès!');
    logger.log(`🌐 URL: http://localhost:${port}/api/v1`);
    if (enableSwagger) {
      logger.log(`📚 Documentation: http://localhost:${port}/api/docs`);
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Obtenir les variables d'environnement
  const port = process.env.PORT || 3000;
  const enableSwagger = process.env.ENABLE_SWAGGER !== 'false'; // Actif par défaut sauf si 'false'
  
  // Confiance au proxy pour le rate limiter
  app.set('trust proxy', 1);
  
  const logger = app.get(LoggerService);
  
  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new SimpleLoggingInterceptor(logger));

  // Global middlewares
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors();

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger setup (conditionnel basé sur la variable d'environnement)
  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('GetMeFixed API')
      .setDescription(`
      # Introduction
      API pour la gestion de licences logicielles GetMeFixed. Cette API permet de gérer des licences, des plans, des plugins et de suivre l'utilisation.
      
      # Authentification
      L'API utilise l'authentification JWT. Pour la plupart des endpoints, vous devez inclure un token Bearer dans l'en-tête de la requête.
      
      # Débuter avec l'API
      1. Créez un compte administrateur avec \`npm run seed:admin\`
      2. Connectez-vous avec cet administrateur via \`/api/v1/auth/login\`
      3. Utilisez le token JWT retourné pour les requêtes authentifiées
      
      # Structure de l'API
      L'API est organisée en modules :
      - **Auth** : Gestion des authentifications administrateur
      - **Licenses** : Création et gestion des licences
      - **License Plans** : Configuration des plans de licence
      - **Plugins** : Gestion des plugins et de leurs versions
      - **Public** : Points d'entrée pour les utilisateurs de licences
      - **Payments** : Intégration des paiements via Stripe
      - **Dashboard** : Statistiques et métriques de l'application
      `)
      .setVersion('1.0')
      .setContact('Support GetMeFixed', 'https://getmefixed.com/support', 'support@getmefixed.com')
      .setExternalDoc('Documentation supplémentaire', 'https://docs.getmefixed.com')
      .addTag('Authentication', 'Authentification des administrateurs')
      .addTag('Licenses', 'Gestion des licences')
      .addTag('License Plans', 'Gestion des plans de licence')
      .addTag('Plugins', 'Gestion des plugins')
      .addTag('Public API', 'Endpoints publics pour les clients')
      .addTag('Paiements', 'Gestion des paiements via Stripe')
      .addTag('Dashboard', 'Statistiques et métriques')
      .addTag('Health', 'Vérification de l\'état de l\'API')
      .addBearerAuth()
      .build();

    // Amélioration des options Swagger
    const customOptions = {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        defaultModelsExpandDepth: 0,
        tryItOutEnabled: true,
        docExpansion: 'none',
        operationsSorter: 'alpha',
        tagsSorter: 'alpha',
      },
      customCss: `
        .swagger-ui .topbar { display: none } 
        .swagger-ui .info { margin: 30px 0 }
        .swagger-ui .info .title { font-size: 36px }
        .swagger-ui .markdown p, .swagger-ui .markdown li { font-size: 16px }
        .swagger-ui .btn.execute { background-color: #007bff }
        .swagger-ui .btn.execute:hover { background-color: #0056b3 }
      `,
      customSiteTitle: 'GetMeFixed API Documentation',
      customfavIcon: 'https://getmefixed.com/favicon.ico'
    };

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, customOptions);
    
    logger.log('Documentation Swagger activée');
  } else {
    logger.log('Documentation Swagger désactivée via ENABLE_SWAGGER=false');
  }

  // Vérifier les connexions aux services externes
  try {
    // Tester la connexion à la base de données
    const prismaService = app.get(PrismaService);
    await prismaService.$connect();
    logger.log('✅ Connexion à la base de données réussie');

    // Activer le hook de fermeture de Prisma
    prismaService.enableShutdownHooks(app);
  } catch (error) {
    logger.error(`❌ Échec de connexion à la base de données: ${error.message}`, error.stack);
  }

  // Démarrer le serveur
  await app.listen(port);
  
  // Afficher la bannière et les informations de démarrage
  displayBanner(logger, +port, enableSwagger);
}

bootstrap().catch((error) => {
  console.error('\x1b[31m❌ Échec du démarrage de l\'application:\x1b[0m', error);
  process.exit(1);
});