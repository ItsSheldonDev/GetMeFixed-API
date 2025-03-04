import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { rateLimit } from 'express-rate-limit';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private limiter: any;

  constructor(
    private reflector: Reflector,
    private logger: LoggerService,
  ) {
    this.limiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 heure par défaut
      max: 5, // 5 requêtes par heure par défaut
      message: 'Too many login attempts from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res, next, options) => {
        this.logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(options.statusCode).json({
          status: 'error',
          message: options.message,
        });
      },
    });
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return new Promise((resolve) => {
      this.limiter(request, response, () => {
        resolve(true);
      });
    });
  }
}