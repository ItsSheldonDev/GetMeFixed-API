// src/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard.dto';

@ApiTags('Tableau de bord')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtenir les statistiques du tableau de bord' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return await this.dashboardService.getDashboardStats();
  }
}