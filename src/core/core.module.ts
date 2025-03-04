import { Module, NestModule, MiddlewareConsumer, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { LoggerService } from './logger/logger.service';
import { HealthController } from './controllers/health.controller';
import { LoggerMiddleware } from './middlewares/logger.middleware';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
    }),
  ],
  controllers: [HealthController], // Supprimer DebugController et MinimalController
  providers: [PrismaService, RedisService, LoggerService],
  exports: [PrismaService, RedisService, LoggerService, JwtModule],
})
export class CoreModule implements NestModule {
  constructor(private logger: LoggerService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}