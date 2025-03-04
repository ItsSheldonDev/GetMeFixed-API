import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { LoggerService } from '../core/logger/logger.service';
import { CreateLicensePlanDto, UpdateLicensePlanDto } from './dto/license-plan.dto';

@Injectable()
export class LicensePlanService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async createPlan(data: CreateLicensePlanDto) {
    const existingPlan = await this.prisma.licensePlan.findFirst({
      where: {
        OR: [
          { name: data.name },
          { identifier: data.identifier },
        ],
      },
    });

    if (existingPlan) {
      throw new BadRequestException('Plan with this name or identifier already exists');
    }

    const plan = await this.prisma.licensePlan.create({
      data,
    });

    this.logger.log(`Created new license plan: ${plan.name}`);
    return plan;
  }

  async getAllPlans() {
    const plans = await this.prisma.licensePlan.findMany({
      orderBy: {
        price: 'asc',
      },
    });

    return plans;
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.licensePlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('License plan not found');
    }

    return plan;
  }

  async updatePlan(id: string, data: UpdateLicensePlanDto) {
    const plan = await this.prisma.licensePlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('License plan not found');
    }

    const updatedPlan = await this.prisma.licensePlan.update({
      where: { id },
      data,
    });

    this.logger.log(`Updated license plan: ${updatedPlan.name}`);
    return updatedPlan;
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.licensePlan.findUnique({
      where: { id },
      include: {
        licenses: {
          take: 1,
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('License plan not found');
    }

    if (plan.licenses.length > 0) {
      throw new BadRequestException('Cannot delete plan with existing licenses');
    }

    await this.prisma.licensePlan.delete({
      where: { id },
    });

    this.logger.log(`Deleted license plan: ${plan.name}`);
    return { success: true };
  }
}