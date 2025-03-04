import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { LicensePlanService } from './license-plan.service';
import { CreateLicensePlanDto, UpdateLicensePlanDto, LicensePlanParamDto } from './dto/license-plan.dto';

@ApiTags('License Plans')
@Controller('license-plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LicensePlanController {
  constructor(private readonly licensePlanService: LicensePlanService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau plan de licence' })
  @ApiResponse({ status: 201, description: 'Plan créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createPlan(@Body() createLicensePlanDto: CreateLicensePlanDto) {
    return await this.licensePlanService.createPlan(createLicensePlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les plans de licence' })
  @ApiResponse({ status: 200, description: 'Liste des plans récupérée avec succès' })
  async getAllPlans() {
    return await this.licensePlanService.getAllPlans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un plan de licence par son ID' })
  @ApiResponse({ status: 200, description: 'Plan récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Plan non trouvé' })
  async getPlanById(@Param() params: LicensePlanParamDto) {
    return await this.licensePlanService.getPlanById(params.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un plan de licence' })
  @ApiResponse({ status: 200, description: 'Plan mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Plan non trouvé' })
  async updatePlan(
    @Param() params: LicensePlanParamDto,
    @Body() updateLicensePlanDto: UpdateLicensePlanDto,
  ) {
    return await this.licensePlanService.updatePlan(params.id, updateLicensePlanDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un plan de licence' })
  @ApiResponse({ status: 200, description: 'Plan supprimé avec succès' })
  @ApiResponse({ status: 400, description: 'Impossible de supprimer le plan (licences existantes)' })
  @ApiResponse({ status: 404, description: 'Plan non trouvé' })
  async deletePlan(@Param() params: LicensePlanParamDto) {
    return await this.licensePlanService.deletePlan(params.id);
  }
}