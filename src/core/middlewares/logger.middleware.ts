import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { ip, method, originalUrl } = req;
    
    const startTime = Date.now();

    // Log lorsque la réponse est terminée
    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;
      
      const message = `${method} ${originalUrl} ${statusCode} ${responseTime}ms - ${ip}`;
      
      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}