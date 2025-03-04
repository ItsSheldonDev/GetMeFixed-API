import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class GetLicenseInfoDto {
  @ApiProperty({ description: 'Clé de licence', example: 'GMF-2025-BSC-A1B2C3D4' })
  @IsString()
  @Matches(/^GMF-\d{4}-[A-Z]{3}-[0-9A-F]{8}$/, { message: 'Format de clé de licence invalide' })
  licenseKey: string;

  @ApiProperty({ description: 'ID de la machine', example: 'MAC-12345678' })
  @IsString()
  machineId: string;
}

export class LicenseInfoResponseDto {
  @ApiProperty({ description: 'Licence valide ou non' })
  isValid: boolean;

  @ApiProperty({ description: 'Type de licence' })
  type: string;

  @ApiProperty({ description: 'Jetons restants' })
  tokensRemaining: number;

  @ApiProperty({ description: 'Date d\'expiration' })
  expirationDate: Date;

  @ApiPropertyOptional({ description: 'Fonctionnalités associées à cette licence' })
  features?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Plugins activés' })
  plugins?: Array<{
    id: string;
    name: string;
    version: string;
  }>;
}