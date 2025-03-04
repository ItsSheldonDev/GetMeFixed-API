import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { PluginService } from './plugin.service';
import { 
  CreatePluginDto, 
  UpdatePluginDto, 
  ActivatePluginDto, 
  PluginParamDto, 
  PluginStatusParamDto 
} from './dto/plugin.dto';
import { Public } from '../core/decorators/public.decorator';

@ApiTags('Plugins')
@Controller('plugins')
@UseGuards(JwtAuthGuard)
export class PluginController {
  constructor(private readonly pluginService: PluginService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Récupérer tous les plugins' })
  @ApiResponse({ status: 200, description: 'Liste des plugins récupérée avec succès' })
  async getAllPlugins() {
    return await this.pluginService.getAllPlugins();
  }

  @Get('status/:licenseKey/:pluginId')
  @Public()
  @ApiOperation({ summary: 'Vérifier le statut d\'un plugin pour une licence' })
  @ApiResponse({ status: 200, description: 'Statut récupéré avec succès' })
  async getPluginStatus(@Param() params: PluginStatusParamDto) {
    return await this.pluginService.getPluginStatus(params.licenseKey, params.pluginId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau plugin' })
  @ApiResponse({ status: 201, description: 'Plugin créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createPlugin(@Body() createPluginDto: CreatePluginDto) {
    return await this.pluginService.createPlugin(createPluginDto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer un plugin par son ID' })
  @ApiResponse({ status: 200, description: 'Plugin récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Plugin non trouvé' })
  async getPluginById(@Param() params: PluginParamDto) {
    return await this.pluginService.getPluginById(params.id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un plugin' })
  @ApiResponse({ status: 200, description: 'Plugin mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Plugin non trouvé' })
  async updatePlugin(
    @Param() params: PluginParamDto,
    @Body() updatePluginDto: UpdatePluginDto,
  ) {
    return await this.pluginService.updatePlugin(params.id, updatePluginDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un plugin' })
  @ApiResponse({ status: 200, description: 'Plugin supprimé avec succès' })
  @ApiResponse({ status: 400, description: 'Impossible de supprimer le plugin (licences actives)' })
  @ApiResponse({ status: 404, description: 'Plugin non trouvé' })
  async deletePlugin(@Param() params: PluginParamDto) {
    return await this.pluginService.deletePlugin(params.id);
  }

  @Post('activate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activer un plugin pour une licence' })
  @ApiResponse({ status: 200, description: 'Plugin activé avec succès' })
  @ApiResponse({ status: 400, description: 'Plugin déjà activé ou licence invalide' })
  @ApiResponse({ status: 404, description: 'Plugin ou licence non trouvé' })
  async activatePlugin(@Body() activatePluginDto: ActivatePluginDto) {
    return await this.pluginService.activatePlugin(
      activatePluginDto.licenseKey,
      activatePluginDto.pluginId,
    );
  }
}