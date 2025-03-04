import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsOptional, IsEnum, IsInt, Min, Max, IsString, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { LICENSE_STATUS, LicenseStatus } from '../../core/constants/license-formats';

export class GenerateLicenseDto {
  @ApiProperty({ description: 'ID du plan de licence' })
  @IsUUID()
  planId: string;

  @ApiProperty({ description: 'Date d\'expiration de la licence', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  expirationDate: string;

  @ApiPropertyOptional({ description: 'ID du client (optionnel)' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Métadonnées supplémentaires (optionnel)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GetLicensesQueryDto {
  @ApiPropertyOptional({ enum: LICENSE_STATUS, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(LICENSE_STATUS)
  status?: LicenseStatus;

  @ApiPropertyOptional({ description: 'Filtrer par ID de plan' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ description: 'Numéro de page', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Nombre d\'éléments par page', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

export class ValidateLicenseResponseDto {
  @ApiProperty({ description: 'Licence valide ou non' })
  isValid: boolean;

  @ApiProperty({ description: 'Type de licence' })
  type: string;

  @ApiProperty({ description: 'Jetons restants' })
  tokensRemaining: number;

  @ApiProperty({ description: 'Date d\'expiration' })
  expirationDate: string;

  @ApiPropertyOptional({ description: 'Plugins associés à la licence' })
  plugins?: Array<{
    id: string;
    version: string;
    status: string;
  }>;
}

export class RevokeLicenseDto {
  @ApiPropertyOptional({ description: 'Raison de la révocation' })
  @IsOptional()
  @IsString()
  reason?: string;
}