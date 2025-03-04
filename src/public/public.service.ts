import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { RedisService } from '../core/redis/redis.service';
import { LoggerService } from '../core/logger/logger.service';
import { LICENSE_STATUS, LICENSE_ACTIONS } from '../core/constants/license-formats';
import { LicenseInfoResponseDto } from './dto/license-info.dto';

type Features = Record<string, boolean | string | number>;

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private logger: LoggerService,
  ) {}

  async validateLicense(licenseKey: string, machineId: string) {
    const cacheKey = `license:${licenseKey}:${machineId}`;
    
    // Vérifier le cache Redis
    const cachedResult = await this.redis.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const license = await this.prisma.license.findUnique({
      where: { key: licenseKey },
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
      throw new NotFoundException('Licence non trouvée');
    }

    if (license.status !== LICENSE_STATUS.ACTIVE) {
      throw new BadRequestException('Licence inactive');
    }

    const now = new Date();
    if (license.expirationDate < now) {
      await this.prisma.license.update({
        where: { id: license.id },
        data: { status: LICENSE_STATUS.EXPIRED },
      });
      throw new BadRequestException('Licence expirée');
    }

    // Enregistrer l'utilisation de la licence
    await this.prisma.licenseUsage.create({
      data: {
        licenseId: license.id,
        action: LICENSE_ACTIONS.VALIDATE,
        machine_id: machineId,
        metadata: {
          timestamp: now.toISOString(),
          success: true,
        },
      },
    });

    const features = (license.plan.features as Features) || {};

    const result = {
      isValid: true,
      type: license.plan.identifier,
      tokensRemaining: license.tokensRemaining,
      expirationDate: license.expirationDate,
      features,
      plugins: license.pluginLicenses.map(pl => ({
        id: pl.plugin.id,
        name: pl.plugin.name,
        version: pl.version.version,
        status: 'ACTIVE',
      })),
    };

    // Mettre en cache pour 5 minutes
    await this.redis.set(cacheKey, result, 300);

    return result;
  }

  async recordHeartbeat(licenseKey: string, machineId: string) {
    const license = await this.prisma.license.findUnique({
      where: { key: licenseKey },
    });

    if (!license || license.status !== LICENSE_STATUS.ACTIVE) {
      throw new BadRequestException('Licence invalide');
    }

    await this.prisma.licenseUsage.create({
      data: {
        licenseId: license.id,
        action: LICENSE_ACTIONS.HEARTBEAT,
        machine_id: machineId,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });

    return { status: 'ok' };
  }

  async consumeTokens(
    licenseKey: string,
    machineId: string,
    tokens: number,
    reason: string,
    additionalInfo?: string,
  ) {
    const license = await this.prisma.license.findUnique({
      where: { key: licenseKey },
    });

    if (!license) {
      throw new NotFoundException('Licence non trouvée');
    }

    if (license.status !== LICENSE_STATUS.ACTIVE) {
      throw new BadRequestException('Licence inactive');
    }

    if (license.tokensRemaining < tokens) {
      throw new BadRequestException('Jetons insuffisants');
    }

    const updatedLicense = await this.prisma.license.update({
      where: { id: license.id },
      data: {
        tokensRemaining: license.tokensRemaining - tokens,
      },
    });

    await this.prisma.licenseUsage.create({
      data: {
        licenseId: license.id,
        action: LICENSE_ACTIONS.CONSUME_TOKEN,
        machine_id: machineId,
        tokens,
        metadata: {
          reason,
          additionalInfo,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      tokensConsumed: tokens,
      tokensRemaining: updatedLicense.tokensRemaining,
    };
  }

  async getLicenseInfo(licenseKey: string, machineId: string): Promise<LicenseInfoResponseDto> {
    const cacheKey = `license_info:${licenseKey}:${machineId}`;
    
    // Vérifier le cache Redis
    const cachedResult = await this.redis.get<LicenseInfoResponseDto>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const license = await this.prisma.license.findUnique({
      where: { key: licenseKey },
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
      throw new NotFoundException('Licence non trouvée');
    }

    if (license.status !== LICENSE_STATUS.ACTIVE) {
      throw new BadRequestException('Licence inactive');
    }

    const now = new Date();
    if (license.expirationDate < now) {
      await this.prisma.license.update({
        where: { id: license.id },
        data: { status: LICENSE_STATUS.EXPIRED },
      });
      throw new BadRequestException('Licence expirée');
    }

    // N'enregistre pas d'utilisation de token ici, juste une consultation
    await this.prisma.licenseUsage.create({
      data: {
        licenseId: license.id,
        action: 'INFO_REQUEST',
        machine_id: machineId,
        metadata: {
          timestamp: now.toISOString(),
          success: true,
        },
      },
    });

    const features = (license.plan.features as Features) || {};

    // Définir correctement le type pour éviter l'erreur TypeScript
    const result: LicenseInfoResponseDto = {
      isValid: true,
      type: license.plan.identifier,
      tokensRemaining: license.tokensRemaining,
      expirationDate: license.expirationDate,
      features,
      plugins: license.pluginLicenses.map(pl => ({
        id: pl.plugin.id,
        name: pl.plugin.name,
        version: pl.version.version,
      })),
    };

    // Mettre en cache pour 5 minutes
    await this.redis.set(cacheKey, result, 300);

    return result;
  }
}