import { Module } from '@nestjs/common';
import { LicensePlanController } from './license-plan.controller';
import { LicensePlanService } from './license-plan.service';

@Module({
  controllers: [LicensePlanController],
  providers: [LicensePlanService],
  exports: [LicensePlanService],
})
export class LicensePlanModule {}