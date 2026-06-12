import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const raw =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const message =
      typeof raw === 'object' && raw !== null && 'message' in raw
        ? (raw as { message: string | string[] }).message
        : raw;

    const logContext = {
      method: request.method,
      url: request.url,
      statusCode: status,
      userId: (request as Request & { user?: { id?: string } }).user?.id,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        { ...logContext, err: exception },
        `Unhandled exception: ${String(exception)}`,
      );
    } else {
      this.logger.warn(logContext, `HTTP ${status}: ${String(message)}`);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
