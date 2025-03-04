import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsBoolean, IsOptional, IsArray, ValidateNested, IsUUID, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class PluginVersionDto {
  @ApiProperty({ example: '1.0.0', description: 'Version du plugin (format: x.y.z)' })
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'Version doit être au format x.y.z' })
  version: string;

  @ApiPropertyOptional({ description: 'Description de la version' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 9.99, description: 'Prix de la version du plugin' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ default: true, description: 'Statut actif de la version' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class CreatePluginDto {
  @ApiProperty({ example: 'Premium Features', description: 'Nom du plugin' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'PREMIUM', description: 'Identifiant unique du plugin' })
  @IsString()
  @Matches(/^[A-Z0-9]+$/, { message: 'L\'identifiant doit contenir uniquement des lettres majuscules et des chiffres' })
  identifier: string;

  @ApiPropertyOptional({ description: 'Description du plugin' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [PluginVersionDto], description: 'Versions du plugin' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PluginVersionDto)
  versions: PluginVersionDto[];
}

export class UpdatePluginDto {
  @ApiPropertyOptional({ example: 'Premium Features', description: 'Nom du plugin' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description du plugin' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Statut actif du plugin' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [PluginVersionDto], description: 'Nouvelles versions à ajouter' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PluginVersionDto)
  versions?: PluginVersionDto[];
}

export class ActivatePluginDto {
  @ApiProperty({ description: 'Clé de licence' })
  @IsString()
  @Matches(/^GMF-\d{4}-[A-Z]{3}-[0-9A-F]{8}$/)
  licenseKey: string;

  @ApiProperty({ description: 'ID du plugin' })
  @IsUUID()
  pluginId: string;
}

export class PluginParamDto {
  @ApiProperty({ description: 'ID du plugin' })
  @IsUUID()
  id: string;
}

export class PluginStatusParamDto {
  @ApiProperty({ description: 'Clé de licence' })
  @IsString()
  @Matches(/^GMF-\d{4}-[A-Z]{3}-[0-9A-F]{8}$/)
  licenseKey: string;

  @ApiProperty({ description: 'ID du plugin' })
  @IsUUID()
  pluginId: string;
}