import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Logging détaillé de l'erreur
    this.logger.error(`Exception détectée: ${exception.message || 'Unknown error'}`, exception.stack || 'No stack trace');
    
    // Détermination du statut HTTP
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Construction de la réponse d'erreur
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Internal Server Error'
    };

    // Si c'est une HttpException, on peut extraire le message
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      errorResponse.message = 
        typeof response === 'object' && 'message' in response
          ? (response as any).message
          : exception.message;
    }

    // Répondre avec une erreur JSON structurée
    response.status(status).json(errorResponse);
  }
}