// src/dashboard/dto/dashboard.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty()
  totalLicenses: number;

  @ApiProperty()
  activeLicenses: number;

  @ApiProperty()
  expiredLicenses: number;

  @ApiProperty()
  revokedLicenses: number;

  @ApiProperty()
  totalTokensConsumed: number;

  @ApiProperty()
  totalLicensePlans: number;

  @ApiProperty()
  totalPlugins: number;

  @ApiProperty()
  recentActivities: Array<{
    id: string;
    action: string;
    licenseKey: string;
    machineId: string;
    timestamp: Date;
  }>;

  @ApiProperty()
  expiringLicenses: Array<{
    id: string;
    key: string;
    expirationDate: Date;
    planName: string;
  }>;
}