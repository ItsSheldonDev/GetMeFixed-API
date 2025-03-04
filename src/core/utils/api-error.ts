import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiError extends HttpException {
  constructor(
    status: HttpStatus,
    message: string,
    errors?: Record<string, string[]>
  ) {
    super(
      {
        status: 'error',
        message,
        errors,
      },
      status
    );
  }
}