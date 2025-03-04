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
      const models = Reflect.ownKeys(this).filter(
        (key) => key[0] !== '_' && key[0] !== '$' && typeof this[key] === 'object',
      );
  
      return Promise.all(
        models.map((modelKey) => this[modelKey].deleteMany()),
      );
    }
  }
}