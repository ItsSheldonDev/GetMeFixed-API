import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CoreModule } from './core/core.module';
import { AuthModule } from './auth/auth.module';
import { LicenseModule } from './license/license.module';
import { LicensePlanModule } from './license-plan/license-plan.module';
import { PluginModule } from './plugin/plugin.module';
import { PublicModule } from './public/public.module';
import { PaymentModule } from './payment/payment.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import configuration from './core/config/configuration';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
    CoreModule,
    AuthModule,
    LicenseModule,
    LicensePlanModule,
    PluginModule,
    PublicModule,
    PaymentModule,
    DashboardModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}