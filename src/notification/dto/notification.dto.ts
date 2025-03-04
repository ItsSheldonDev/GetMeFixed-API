// src/notification/dto/notification.dto.ts (corrigé)
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export enum NotificationType {
  LICENSE_EXPIRING = 'LICENSE_EXPIRING',
  TOKEN_LOW = 'TOKEN_LOW',
  LICENSE_CREATED = 'LICENSE_CREATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PLUGIN_ACTIVATED = 'PLUGIN_ACTIVATED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  SECURITY_ALERT = 'SECURITY_ALERT',
}

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType, enumName: 'NotificationType', description: 'Type de notification' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Message de la notification' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'ID de l\'utilisateur destinataire' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'ID de la licence associée (optionnel)' })
  @IsOptional()
  @IsUUID()
  licenseId?: string;

  @ApiPropertyOptional({ description: 'Métadonnées supplémentaires (optionnel)' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateNotificationDto {
  @ApiProperty({ description: 'Statut de lecture de la notification' })
  @IsBoolean()
  read: boolean;
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'ID unique de la notification' })
  id: string;

  @ApiProperty({ enum: NotificationType, enumName: 'NotificationType', description: 'Type de notification' })
  type: NotificationType;

  @ApiProperty({ description: 'Message de la notification' })
  message: string;

  @ApiProperty({ description: 'ID de l\'utilisateur destinataire' })
  adminId: string;

  @ApiPropertyOptional({ description: 'ID de la licence associée (si applicable)' })
  licenseId?: string;

  @ApiProperty({ description: 'Statut de lecture de la notification' })
  read: boolean;

  @ApiProperty({ description: 'Date de création de la notification' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Métadonnées supplémentaires' })
  metadata?: Record<string, any>;
}

export class NotificationCountDto {
  @ApiProperty({ description: 'Nombre de notifications non lues' })
  unreadCount: number;
}