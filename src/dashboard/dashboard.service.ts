// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { DashboardStatsDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    // Obtenir les comptages de licences par statut
    const licenseCounts = await this.prisma.$transaction([
      this.prisma.license.count(),
      this.prisma.license.count({ where: { status: 'ACTIVE' } }),
      this.prisma.license.count({ where: { status: 'EXPIRED' } }),
      this.prisma.license.count({ where: { status: 'REVOKED' } }),
    ]);

    // Calculer le total de jetons consommés
    const tokenUsage = await this.prisma.licenseUsage.aggregate({
      where: { action: 'CONSUME_TOKEN' },
      _sum: { tokens: true },
    });

    // Compter les plans et plugins
    const [planCount, pluginCount] = await Promise.all([
      this.prisma.licensePlan.count(),
      this.prisma.plugin.count(),
    ]);

    // Obtenir les activités récentes
    const recentActivities = await this.prisma.licenseUsage.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { license: true },
    });

    // Trouver les licences expirant bientôt
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const expiringLicenses = await this.prisma.license.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          lte: nextWeek,
          gt: new Date(),
        },
      },
      take: 5,
      include: { plan: true },
      orderBy: { expirationDate: 'asc' },
    });

    return {
      totalLicenses: licenseCounts[0],
      activeLicenses: licenseCounts[1],
      expiredLicenses: licenseCounts[2],
      revokedLicenses: licenseCounts[3],
      totalTokensConsumed: tokenUsage._sum.tokens || 0,
      totalLicensePlans: planCount,
      totalPlugins: pluginCount,
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        licenseKey: activity.license.key,
        machineId: activity.machine_id,
        timestamp: activity.createdAt,
      })),
      expiringLicenses: expiringLicenses.map(license => ({
        id: license.id,
        key: license.key,
        expirationDate: license.expirationDate,
        planName: license.plan.name,
      })),
    };
  }
}