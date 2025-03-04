import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional, Matches } from 'class-validator';
import { GetLicenseInfoDto, LicenseInfoResponseDto } from './license-info.dto';

export { GetLicenseInfoDto, LicenseInfoResponseDto };

export class ValidateLicenseDto {
  @ApiProperty({ description: 'Clé de licence', example: 'GMF-2025-BSC-A1B2C3D4' })
  @IsString()
  @Matches(/^GMF-\d{4}-[A-Z]{3}-[0-9A-F]{8}$/, { message: 'Format de clé de licence invalide' })
  licenseKey: string;

  @ApiProperty({ description: 'ID de la machine', example: 'MAC-12345678' })
  @IsString()
  machineId: string;
}

export class HeartbeatDto {
  @ApiProperty({ description: 'Clé de licence', example: 'GMF-2025-BSC-A1B2C3D4' })
  @IsString()
  @Matches(/^GMF-\d{4}-[A-Z]{3}-[0-9A-F]{8}$/, { message: 'Format de clé de licence invalide' })
  licenseKey: string;

  @ApiProperty({ description: 'ID de la machine', example: 'MAC-12345678' })
  @IsString()
  machineId: string;
}

export class ConsumeTokenDto {
  @ApiProperty({ description: 'Clé de licence', example: 'GMF-2025-BSC-A1B2C3D4' })
  @IsString()
  @Matches(/^GMF-\d{4}-[A-Z]{3}-[0-9A-F]{8}$/, { message: 'Format de clé de licence invalide' })
  licenseKey: string;

  @ApiProperty({ description: 'ID de la machine', example: 'MAC-12345678' })
  @IsString()
  machineId: string;

  @ApiProperty({ description: 'Nombre de jetons à consommer', example: 1 })
  @IsNumber()
  @Min(1)
  tokens: number;

  @ApiProperty({ description: 'Raison de la consommation de jetons', example: 'Feature XYZ usage' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Informations supplémentaires' })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}