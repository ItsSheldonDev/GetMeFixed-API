// app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('api/v1')
  getApi(): { message: string } {
    return { message: 'API is working!' };
  }
}   