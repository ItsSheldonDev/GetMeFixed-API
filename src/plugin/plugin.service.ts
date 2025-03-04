import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { LoggerService } from '../core/logger/logger.service';
import { CreatePluginDto, UpdatePluginDto } from './dto/plugin.dto';

@Injectable()
export class PluginService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async createPlugin(data: CreatePluginDto) {
    const existingPlugin = await this.prisma.plugin.findFirst({
      where: {
        OR: [
          { name: data.name },
          { identifier: data.identifier },
        ],
      },
    });

    if (existingPlugin) {
      throw new BadRequestException('Plugin with this name or identifier already exists');
    }

    const plugin = await this.prisma.plugin.create({
      data: {
        name: data.name,
        identifier: data.identifier,
        description: data.description,
        versions: {
          create: data.versions,
        },
      },
      include: {
        versions: true,
      },
    });

    this.logger.log(`Created new plugin: ${plugin.name}`);
    return plugin;
  }

  async getAllPlugins() {
    const plugins = await this.prisma.plugin.findMany({
      include: {
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return plugins;
  }

  async getPluginById(id: string) {
    const plugin = await this.prisma.plugin.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    return plugin;
  }

  async updatePlugin(id: string, data: UpdatePluginDto) {
    const plugin = await this.prisma.plugin.findUnique({
      where: { id },
    });

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    const updatedPlugin = await this.prisma.plugin.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        ...(data.versions && data.versions.length > 0 ? {
          versions: {
            createMany: {
              data: data.versions,
            },
          }
        } : {}),
      },
      include: {
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    this.logger.log(`Updated plugin: ${updatedPlugin.name}`);
    return updatedPlugin;
  }

  async deletePlugin(id: string) {
    const plugin = await this.prisma.plugin.findUnique({
      where: { id },
      include: {
        pluginLicenses: {
          take: 1,
        },
      },
    });

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    if (plugin.pluginLicenses.length > 0) {
      throw new BadRequestException('Cannot delete plugin with active licenses');
    }

    await this.prisma.plugin.delete({
      where: { id },
    });

    this.logger.log(`Deleted plugin: ${plugin.name}`);
    return { success: true };
  }

  async activatePlugin(licenseKey: string, pluginId: string) {
    const license = await this.prisma.license.findUnique({
      where: { key: licenseKey },
      include: { pluginLicenses: true }
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    if (license.status !== 'ACTIVE') {
      throw new BadRequestException('License is not active');
    }

    const plugin = await this.prisma.plugin.findUnique({
      where: { id: pluginId },
      include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    const latestVersion = plugin.versions[0];
    if (!latestVersion) {
      throw new BadRequestException('No version available for this plugin');
    }

    // Vérifier si le plugin n'est pas déjà activé pour cette licence
    const existingLicense = await this.prisma.pluginLicense.findFirst({
      where: {
        licenseId: license.id,
        pluginId: plugin.id
      }
    });

    if (existingLicense) {
      throw new BadRequestException('Plugin is already activated for this license');
    }

    const pluginLicense = await this.prisma.pluginLicense.create({
      data: {
        licenseId: license.id,
        pluginId: plugin.id,
        versionId: latestVersion.id,
        expirationDate: license.expirationDate
      },
      include: {
        plugin: true,
        version: true
      }
    });

    this.logger.log(`Activated plugin ${plugin.name} for license ${license.key}`);
    return pluginLicense;
  }

  async getPluginStatus(licenseKey: string, pluginId: string) {
    const pluginLicense = await this.prisma.pluginLicense.findFirst({
      where: {
        license: { key: licenseKey },
        pluginId: pluginId
      },
      include: {
        plugin: true,
        version: true,
        license: true
      }
    });

    if (!pluginLicense) {
      return { isActive: false };
    }

    const now = new Date();
    const isExpired = pluginLicense.expirationDate && pluginLicense.expirationDate < now;

    return {
      isActive: pluginLicense.license.status === 'ACTIVE' && !isExpired,
      version: pluginLicense.version.version,
      expirationDate: pluginLicense.expirationDate
    };
  }
}