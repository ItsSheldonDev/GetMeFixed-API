import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsBoolean, IsOptional, IsUUID, Length, Matches } from 'class-validator';

export class CreateLicensePlanDto {
  @ApiProperty({ example: 'Basic', description: 'Nom du plan de licence' })
  @IsString()
  @Length(3, 50)
  name: string;

  @ApiProperty({ example: 'BSC', description: 'Identifiant du plan (3 lettres majuscules)' })
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Identifier must be exactly 3 uppercase letters' })
  identifier: string;

  @ApiProperty({ example: 100, description: 'Nombre de jetons inclus dans le plan' })
  @IsNumber()
  @Min(0)
  tokens: number;

  @ApiPropertyOptional({ example: 'Basic license plan', description: 'Description du plan (optionnel)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 9.99, description: 'Prix du plan' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ default: true, description: 'Statut actif du plan (optionnel)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateLicensePlanDto {
  @ApiPropertyOptional({ example: 'Basic', description: 'Nom du plan de licence' })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  name?: string;

  @ApiPropertyOptional({ example: 100, description: 'Nombre de jetons inclus dans le plan' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tokens?: number;

  @ApiPropertyOptional({ example: 'Basic license plan', description: 'Description du plan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 9.99, description: 'Prix du plan' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ default: true, description: 'Statut actif du plan' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class LicensePlanParamDto {
  @ApiProperty({ description: 'ID du plan de licence' })
  @IsUUID()
  id: string;
}