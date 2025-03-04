// src/core/controllers/api-info.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';

@ApiTags('API Info')
@Controller('info')
export class ApiInfoController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Récupérer les informations générales de l\'API' })
  @ApiResponse({ status: 200, description: 'Informations de l\'API récupérées avec succès' })
  getApiInfo() {
    return {
      name: 'GetMeFixed API',
      version: '1.0.0',
      description: 'API pour la gestion de licences logicielles',
      endpoints: {
        documentation: '/api/docs',
        authentication: '/api/v1/auth',
        licenses: '/api/v1/licenses',
        licensePlans: '/api/v1/license-plans',
        plugins: '/api/v1/plugins',
        public: '/api/v1/public',
        dashboard: '/api/v1/dashboard',
        notifications: '/api/v1/notifications',
      },
      status: 'online',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('routes')
  @Public()
  @ApiOperation({ summary: 'Récupérer les routes disponibles pour le frontend' })
  @ApiResponse({ status: 200, description: 'Routes récupérées avec succès' })
  getRoutes() {
    return {
      dashboard: {
        path: '/dashboard',
        title: 'Tableau de bord',
        icon: 'dashboard',
        roles: ['admin', 'support'],
      },
      licenses: {
        path: '/licenses',
        title: 'Licences',
        icon: 'key',
        roles: ['admin', 'support'],
      },
      licensePlans: {
        path: '/license-plans',
        title: 'Plans de licence',
        icon: 'package',
        roles: ['admin'],
      },
      plugins: {
        path: '/plugins',
        title: 'Plugins',
        icon: 'puzzle',
        roles: ['admin', 'support'],
      },
      payments: {
        path: '/payments',
        title: 'Paiements',
        icon: 'credit-card',
        roles: ['admin'],
      },
      users: {
        path: '/users',
        title: 'Utilisateurs',
        icon: 'users',
        roles: ['admin'],
      },
      settings: {
        path: '/settings',
        title: 'Paramètres',
        icon: 'settings',
        roles: ['admin'],
      },
    };
  }

  @Get('dashboard-widgets')
  @Public()
  @ApiOperation({ summary: 'Récupérer la configuration des widgets du dashboard' })
  @ApiResponse({ status: 200, description: 'Configuration des widgets récupérée avec succès' })
  getDashboardWidgets() {
    return {
      widgets: [
        {
          id: 'license-summary',
          title: 'Résumé des licences',
          type: 'statistics',
          size: 'large',
          endpoint: '/api/v1/dashboard/stats',
          refresh: 300, // en secondes
          position: 1,
        },
        {
          id: 'license-expiring',
          title: 'Licences expirant bientôt',
          type: 'table',
          size: 'medium',
          endpoint: '/api/v1/dashboard/stats',
          dataKey: 'expiringLicenses',
          refresh: 3600,
          position: 2,
        },
        {
          id: 'recent-activities',
          title: 'Activités récentes',
          type: 'timeline',
          size: 'medium',
          endpoint: '/api/v1/dashboard/stats',
          dataKey: 'recentActivities',
          refresh: 60,
          position: 3,
        },
        {
          id: 'token-usage',
          title: 'Utilisation des jetons',
          type: 'chart',
          chartType: 'line',
          size: 'medium',
          endpoint: '/api/v1/dashboard/token-usage',
          refresh: 3600,
          position: 4,
        },
      ],
      layouts: {
        desktop: [
          { i: 'license-summary', x: 0, y: 0, w: 12, h: 2 },
          { i: 'license-expiring', x: 0, y: 2, w: 6, h: 4 },
          { i: 'recent-activities', x: 6, y: 2, w: 6, h: 4 },
          { i: 'token-usage', x: 0, y: 6, w: 12, h: 4 },
        ],
        tablet: [
          { i: 'license-summary', x: 0, y: 0, w: 8, h: 2 },
          { i: 'license-expiring', x: 0, y: 2, w: 8, h: 4 },
          { i: 'recent-activities', x: 0, y: 6, w: 8, h: 4 },
          { i: 'token-usage', x: 0, y: 10, w: 8, h: 4 },
        ],
        mobile: [
          { i: 'license-summary', x: 0, y: 0, w: 4, h: 2 },
          { i: 'license-expiring', x: 0, y: 2, w: 4, h: 4 },
          { i: 'recent-activities', x: 0, y: 6, w: 4, h: 4 },
          { i: 'token-usage', x: 0, y: 10, w: 4, h: 4 },
        ],
      },
    };
  }
}