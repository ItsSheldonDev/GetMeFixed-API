import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health') // Enlever 'api/v1/'
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  @Public()
  async check() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'unknown',
        redis: 'unknown',
      }
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      health.services.database = 'ok';
    } catch (e) {
      health.services.database = 'error';
      health.status = 'error';
    }

    try {
      const redisClient = this.redis.getClient();
      if (redisClient.isOpen) {
        await redisClient.ping();
        health.services.redis = 'ok';
      } else {
        health.services.redis = 'disconnected';
        health.status = 'warning';
      }
    } catch (e) {
      health.services.redis = 'error';
      health.status = 'error';
    }

    return health;
  }
}