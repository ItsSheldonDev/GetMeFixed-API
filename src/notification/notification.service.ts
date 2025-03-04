// src/notification/notification.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { LoggerService } from '../core/logger/logger.service';
import { CreateNotificationDto, NotificationType } from './dto/notification.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createNotification(data: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        type: data.type,
        message: data.message,
        adminId: data.userId,
        licenseId: data.licenseId,
        metadata: data.metadata || {},
        read: false,
      },
    });

    // Émettre un événement pour notification en temps réel (pour WebSockets)
    this.eventEmitter.emit('notification.created', notification);

    return notification;
  }

  async checkExpiringLicenses() {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + 7); // Licences expirant dans 7 jours

    const expiringLicenses = await this.prisma.license.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          lte: thresholdDate,
          gt: new Date(), // Pas encore expirées
        },
      },
      include: {
        plan: true,
      },
    });

    const admins = await this.prisma.admin.findMany();
    if (!admins.length) return;

    for (const license of expiringLicenses) {
      const message = `La licence ${license.key} (plan ${license.plan.name}) expire le ${license.expirationDate.toLocaleDateString()}`;
      
      await this.createNotification({
        type: NotificationType.LICENSE_EXPIRING,
        message,
        userId: admins[0].id, // Première admin par défaut
        licenseId: license.id,
      });
    }
  }

  async checkLowTokens() {
    // Trouver les licences avec moins de 10% de jetons restants
    const licenses = await this.prisma.license.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    const admins = await this.prisma.admin.findMany();
    if (!admins.length) return;

    for (const license of licenses) {
      const tokenPercentage = (license.tokensRemaining / license.plan.tokens) * 100;
      if (tokenPercentage < 10) {
        const message = `La licence ${license.key} n'a plus que ${license.tokensRemaining} jetons (${tokenPercentage.toFixed(1)}%)`;
        
        await this.createNotification({
          type: NotificationType.TOKEN_LOW,
          message,
          userId: admins[0].id,
          licenseId: license.id,
        });
      }
    }
  }

  async getNotifications(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, notifications] = await Promise.all([
      this.prisma.notification.count({
        where: { adminId: userId },
      }),
      this.prisma.notification.findMany({
        where: { adminId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    return await this.prisma.notification.update({
      where: {
        id,
        adminId: userId,
      },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return await this.prisma.notification.updateMany({
      where: {
        adminId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }
}