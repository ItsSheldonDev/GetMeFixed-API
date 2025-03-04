import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { RedisService } from '../core/redis/redis.service';
import { LoggerService } from '../core/logger/logger.service';
import { generateLicenseKey } from '../core/utils/license/generator';
import { LICENSE_STATUS, LICENSE_ACTIONS, LicenseStatus } from '../core/constants/license-formats';
import { GenerateLicenseDto, GetLicensesQueryDto } from './dto/license.dto';
import { CreateFreeTrialDto } from './dto/free-trial.dto';

@Injectable()
export class LicenseService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private logger: LoggerService,
  ) {}

  async generateLicense(data: GenerateLicenseDto) {
    const plan = await this.prisma.licensePlan.findUnique({
      where: { id: data.planId },
    });

    if (!plan) {
      throw new NotFoundException('License plan not found');
    }

    if (!plan.isActive) {
      throw new BadRequestException('License plan is not active');
    }

    const key = await generateLicenseKey(plan.identifier);

    const license = await this.prisma.license.create({
      data: {
        key,
        planId: plan.id,
        status: LICENSE_STATUS.ACTIVE as LicenseStatus,
        expirationDate: new Date(data.expirationDate),
        customerId: data.customerId,
        metadata: data.metadata || {},
        tokensRemaining: plan.tokens,
      },
      include: {
        plan: true,
      },
    });

    this.logger.log(`Generated new license: ${license.key}`);
    return license;
  }

  async getLicenses(params: GetLicensesQueryDto) {
    const { page = 1, limit = 10, status, planId } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(planId && { planId }),
    };

    const [total, licenses] = await Promise.all([
      this.prisma.license.count({ where }),
      this.prisma.license.findMany({
        where,
        skip,
        take: limit,
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return {
      data: licenses,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async validateLicense(key: string) {
    const cacheKey = `license:${key}`;
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const license = await this.prisma.license.findUnique({
      where: { key },
      include: {
        plan: true,
        pluginLicenses: {
          include: {
            plugin: true,
            version: true,
          },
        },
      },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    if (license.status === LICENSE_STATUS.REVOKED) {
      throw new BadRequestException('License has been revoked');
    }

    const now = new Date();
    const isExpired = license.expirationDate < now;

    if (isExpired) {
      await this.prisma.license.update({
        where: { id: license.id },
        data: { status: LICENSE_STATUS.EXPIRED },
      });
      throw new BadRequestException('License has expired');
    }

    const validationResult = {
      isValid: true,
      type: license.plan.identifier,
      tokensRemaining: license.tokensRemaining,
      expirationDate: license.expirationDate.toISOString(),
      plugins: license.pluginLicenses.map(pl => ({
        id: pl.plugin.id,
        version: pl.version.version,
        status: pl.version.isActive ? LICENSE_STATUS.ACTIVE : 'INACTIVE',
      })),
    };

    await this.redis.set(cacheKey, validationResult, 300);

    return validationResult;
  }

  async getLicenseById(id: string) {
    const license = await this.prisma.license.findUnique({
      where: { id },
      include: {
        plan: true,
        pluginLicenses: {
          include: {
            plugin: true,
            version: true,
          },
        },
      },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    return license;
  }

  async getLicenseHistory(id: string) {
    const history = await this.prisma.licenseUsage.findMany({
      where: { licenseId: id },
      orderBy: { createdAt: 'desc' },
    });

    return history;
  }

  async revokeLicense(id: string, reason?: string) {
    const license = await this.prisma.license.update({
      where: { id },
      data: { status: LICENSE_STATUS.REVOKED },
      include: {
        plan: true,
      },
    });

    await this.redis.del(`license:${license.key}`);

    // Ajouter l'historique de révocation
    await this.prisma.licenseUsage.create({
      data: {
        licenseId: license.id,
        action: LICENSE_ACTIONS.VALIDATE,
        machine_id: 'SYSTEM',
        metadata: {
          timestamp: new Date().toISOString(),
          reason: reason || 'License revoked by admin'
        },
      },
    });

    this.logger.log(`Revoked license: ${license.key}`);
    return license;
  }

  async createFreeTrial(data: CreateFreeTrialDto) {
    const plan = await this.prisma.licensePlan.findUnique({
      where: { id: data.planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan de licence non trouvé');
    }

    if (!plan.isActive) {
      throw new BadRequestException('Ce plan de licence n\'est pas actif pour les essais');
    }

    // Vérifier si l'email a déjà un essai actif
    const existingTrial = await this.prisma.license.findFirst({
      where: {
        metadata: {
          path: ['trialCreatedFor'],
          equals: data.email
        },
        status: LICENSE_STATUS.ACTIVE
      }
    });

    if (existingTrial) {
      throw new BadRequestException('Un essai gratuit est déjà actif pour cet email');
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + (data.durationDays || 14));

    // Générer une clé de licence
    const key = await generateLicenseKey(plan.identifier);

    // Créer la licence d'essai
    const license = await this.prisma.license.create({
      data: {
        key,
        planId: plan.id,
        status: LICENSE_STATUS.ACTIVE,
        expirationDate,
        customerId: null,
        metadata: {
          trialCreatedFor: data.email,
          customerName: data.name,
          additionalInfo: data.additionalInfo,
          isTrial: true,
          createdAt: new Date().toISOString()
        },
        tokensRemaining: plan.tokens,
      },
      include: {
        plan: true,
      },
    });

    // Enregistrer l'utilisation
    await this.prisma.licenseUsage.create({
      data: {
        licenseId: license.id,
        action: 'FREE_TRIAL_CREATED',
        machine_id: 'SYSTEM',
        metadata: {
          email: data.email,
          name: data.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    this.logger.log(`Essai gratuit créé pour ${data.email}: ${license.key}`);

    return {
      licenseKey: license.key,
      expirationDate: license.expirationDate,
      plan: license.plan.name,
      tokens: license.tokensRemaining,
      durationDays: data.durationDays || 14
    };
  }
}