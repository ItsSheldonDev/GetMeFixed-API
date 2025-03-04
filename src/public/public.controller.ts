import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { ValidateLicenseDto, HeartbeatDto, ConsumeTokenDto } from './dto/public.dto';
import { GetLicenseInfoDto, LicenseInfoResponseDto } from './dto/license-info.dto';
import { Public } from '../core/decorators/public.decorator'; // Ajoutez cette importation

@ApiTags('Public API')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Post('validate')
  @Public() // Ajoutez ce décorateur
  @ApiOperation({ summary: 'Valider une licence' })
  @ApiResponse({ status: 200, description: 'Licence validée avec succès' })
  @ApiResponse({ status: 403, description: 'Licence invalide ou expirée' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async validateLicense(@Body() validateLicenseDto: ValidateLicenseDto) {
    return await this.publicService.validateLicense(
      validateLicenseDto.licenseKey,
      validateLicenseDto.machineId,
    );
  }

  @Post('heartbeat')
  @Public() // Ajoutez ce décorateur
  @ApiOperation({ summary: 'Enregistrer un heartbeat pour une licence' })
  @ApiResponse({ status: 200, description: 'Heartbeat enregistré avec succès' })
  @ApiResponse({ status: 403, description: 'Licence invalide' })
  async heartbeat(@Body() heartbeatDto: HeartbeatDto) {
    return await this.publicService.recordHeartbeat(
      heartbeatDto.licenseKey,
      heartbeatDto.machineId,
    );
  }

  @Post('consume-token')
  @Public() // Ajoutez ce décorateur
  @ApiOperation({ summary: 'Consommer des jetons d\'une licence' })
  @ApiResponse({ status: 200, description: 'Jetons consommés avec succès' })
  @ApiResponse({ status: 403, description: 'Licence invalide ou jetons insuffisants' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async consumeToken(@Body() consumeTokenDto: ConsumeTokenDto) {
    return await this.publicService.consumeTokens(
      consumeTokenDto.licenseKey,
      consumeTokenDto.machineId,
      consumeTokenDto.tokens,
      consumeTokenDto.reason,
      consumeTokenDto.additionalInfo,
    );
  }

  @Post('info')
  @Public() // Ajoutez ce décorateur
  @ApiOperation({ summary: 'Obtenir les informations d\'une licence sans consommer de jetons' })
  @ApiResponse({ status: 200, type: LicenseInfoResponseDto })
  @ApiResponse({ status: 403, description: 'Licence invalide ou expirée' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async getLicenseInfo(@Body() data: GetLicenseInfoDto) {
    return await this.publicService.getLicenseInfo(data.licenseKey, data.machineId);
  }
}