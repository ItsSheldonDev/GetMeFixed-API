// src/notification/notification.module.ts
import { Module } from '@nestjs/common';
// Import ScheduleModule retiré car il n'est pas installé
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    // ScheduleModule.forRoot() retiré car le package n'est pas installé
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}