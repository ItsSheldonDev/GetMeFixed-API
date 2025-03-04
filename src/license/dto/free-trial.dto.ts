import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsNumber, Min, Max, IsUUID } from 'class-validator';

export class CreateFreeTrialDto {
  @ApiProperty({ description: 'Email du client' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Nom du client' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'ID du plan de licence pour l\'essai' })
  @IsUUID()
  planId: string;

  @ApiPropertyOptional({ description: 'Durée de l\'essai en jours', default: 14 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  durationDays?: number = 14;

  @ApiPropertyOptional({ description: 'Informations supplémentaires sur le client' })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

export class FreeTrialResponseDto {
  @ApiProperty({ description: 'Clé de licence' })
  licenseKey: string;

  @ApiProperty({ description: 'Date d\'expiration' })
  expirationDate: Date;

  @ApiProperty({ description: 'Nom du plan' })
  plan: string;

  @ApiProperty({ description: 'Nombre de jetons disponibles' })
  tokens: number;

  @ApiProperty({ description: 'Durée de l\'essai en jours' })
  durationDays: number;
}