import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Utilise process au lieu de l'événement Prisma non supporté
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'production') {
      // Version corrigée pour éviter l'erreur de type "symbol" avec TypeScript strict
      const modelNames = Object.keys(this)
        .filter(key => {
          return !key.startsWith('_') && 
                 !key.startsWith('$') && 
                 typeof this[key as keyof this] === 'object';
        });
  
      return Promise.all(
        modelNames.map(modelName => {
          const model = this[modelName as keyof this] as any;
          if (model && typeof model.deleteMany === 'function') {
            return model.deleteMany();
          }
          return Promise.resolve();
        }),
      );
    }
  }
}