import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { LicenseService } from './license.service';
import { GenerateLicenseDto, GetLicensesQueryDto, ValidateLicenseResponseDto, RevokeLicenseDto } from './dto/license.dto';
import { CreateFreeTrialDto } from './dto/free-trial.dto';
import { Public } from '../core/decorators/public.decorator';

@ApiTags('Licenses')
@Controller('licenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Générer une nouvelle licence' })
  @ApiResponse({ status: 201, description: 'Licence générée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async generateLicense(@Body() data: GenerateLicenseDto) {
    return await this.licenseService.generateLicense(data);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les licences avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste des licences récupérée avec succès' })
  async getLicenses(@Query() query: GetLicensesQueryDto) {
    return await this.licenseService.getLicenses(query);
  }

  @Get('validate/:key')
  @Public()
  @ApiOperation({ summary: 'Valider une licence par sa clé' })
  @ApiParam({ name: 'key', description: 'Clé de licence à valider' })
  @ApiResponse({ status: 200, description: 'Licence validée avec succès', type: ValidateLicenseResponseDto })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async validateLicense(@Param('key') key: string) {
    return await this.licenseService.validateLicense(key);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une licence par son ID' })
  @ApiParam({ name: 'id', description: 'ID de la licence' })
  @ApiResponse({ status: 200, description: 'Licence récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async getLicenseById(@Param('id') id: string) {
    return await this.licenseService.getLicenseById(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Récupérer l\'historique d\'une licence' })
  @ApiParam({ name: 'id', description: 'ID de la licence' })
  @ApiResponse({ status: 200, description: 'Historique récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async getLicenseHistory(@Param('id') id: string) {
    return { history: await this.licenseService.getLicenseHistory(id) };
  }

  @Put(':id/revoke')
  @ApiOperation({ summary: 'Révoquer une licence' })
  @ApiParam({ name: 'id', description: 'ID de la licence' })
  @ApiResponse({ status: 200, description: 'Licence révoquée avec succès' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async revokeLicense(@Param('id') id: string, @Body() data: RevokeLicenseDto) {
    return await this.licenseService.revokeLicense(id, data.reason);
  }

  @Post('free-trial')
  @Public()
  @ApiOperation({ summary: 'Créer une licence d\'essai gratuit' })
  @ApiResponse({ status: 201, description: 'Essai gratuit créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Plan de licence non trouvé' })
  async createFreeTrial(@Body() data: CreateFreeTrialDto) {
    return await this.licenseService.createFreeTrial(data);
  }
}