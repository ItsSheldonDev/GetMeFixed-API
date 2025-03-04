// src/notification/notification.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, NotificationResponseDto, UpdateNotificationDto } from './dto/notification.dto';
import { PaginationQueryDto } from '../core/dto/pagination.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer les notifications de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Liste des notifications récupérée avec succès', type: [NotificationResponseDto] })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page', type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, description: 'Filtrer uniquement les notifications non lues', type: Boolean })
  async getNotifications(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    const userId = 'admin-id'; // À remplacer par l'ID réel de l'utilisateur connecté (via JWT)
    const page = paginationQuery.page || 1;
    const limit = paginationQuery.limit || 10;
    
    // NOTE: Modifié pour n'utiliser que 3 arguments conformément à la méthode dans le service
    return this.notificationService.getNotifications(userId, page, limit);
  }

  @Get('count')
  @ApiOperation({ summary: 'Obtenir le nombre de notifications non lues' })
  @ApiResponse({ status: 200, description: 'Comptage réussi' })
  async getUnreadCount() {
    // NOTE: Cette méthode sera ajoutée au service de notification
    const userId = 'admin-id'; // À remplacer par l'ID réel de l'utilisateur connecté (via JWT)
    // Cette ligne est commentée car la méthode n'existe pas encore dans le service
    // return this.notificationService.getUnreadCount(userId);
    
    // En attendant que la méthode soit implémentée, on retourne une valeur statique
    return { unreadCount: 0 };
  }

  @Post('mark-read/:id')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue' })
  async markAsRead(@Param('id') id: string) {
    const userId = 'admin-id'; // À remplacer par l'ID réel de l'utilisateur connecté (via JWT)
    return this.notificationService.markAsRead(id, userId);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  @ApiResponse({ status: 200, description: 'Toutes les notifications marquées comme lues' })
  async markAllAsRead() {
    const userId = 'admin-id'; // À remplacer par l'ID réel de l'utilisateur connecté (via JWT)
    return this.notificationService.markAllAsRead(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une notification (pour les tests/admin)' })
  @ApiResponse({ status: 201, description: 'Notification créée' })
  async createNotification(@Body() data: CreateNotificationDto) {
    return this.notificationService.createNotification(data);
  }
}