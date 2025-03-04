import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';
import { ApiError } from '../utils/api-error';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ErrorMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    next((err: Error) => {
      this.logger.error(`Error occurred: ${err.message}`, err.stack);

      // Journalisation des informations supplémentaires séparément
      this.logger.error(`Path: ${req.path}, Method: ${req.method}`);

      if (err instanceof ApiError) {
        return res.status(err['status']).json({
          status: 'error',
          message: err.message,
          errors: err['errors'],
        });
      }

      // Prisma Error handling
      if (err instanceof PrismaClientKnownRequestError) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          status: 'error',
          message: 'Database error occurred',
          code: err.code,
        });
      }

      // Default error handling
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Internal server error',
      });
    });
  }
}