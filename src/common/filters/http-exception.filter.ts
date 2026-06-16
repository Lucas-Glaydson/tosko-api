import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

// MongoDB duplicate key error code
const MONGO_DUPLICATE_KEY_CODE = 11000;

function getMongoErrorStatus(exception: unknown): number | null {
  if (
    typeof exception === 'object' &&
    exception !== null &&
    'code' in exception &&
    (exception as { code: number }).code === MONGO_DUPLICATE_KEY_CODE
  ) {
    return HttpStatus.CONFLICT;
  }
  // Mongoose ValidationError
  if (
    typeof exception === 'object' &&
    exception !== null &&
    'name' in exception &&
    (exception as { name: string }).name === 'ValidationError'
  ) {
    return HttpStatus.BAD_REQUEST;
  }
  return null;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const mongoStatus = getMongoErrorStatus(exception);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : (mongoStatus ?? HttpStatus.INTERNAL_SERVER_ERROR);

    const raw =
      exception instanceof HttpException
        ? exception.getResponse()
        : mongoStatus === HttpStatus.CONFLICT
          ? 'E-mail já cadastrado'
          : mongoStatus === HttpStatus.BAD_REQUEST
            ? 'Dados inválidos'
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

