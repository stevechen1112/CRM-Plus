import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiError } from '@crm/shared';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const message = typeof exceptionResponse === 'string' 
      ? exceptionResponse 
      : (exceptionResponse as any).message || exception.message;

    const errorResponse: ApiError = {
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      error: exception.name,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log error for monitoring
    console.error(JSON.stringify({
      ...errorResponse,
      requestId: request.headers['x-request-id'],
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    }));

    response.status(status).json(errorResponse);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    const errorResponse: ApiError = {
      statusCode: status,
      message,
      error: exception instanceof Error ? exception.name : 'UnknownError',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log error for monitoring
    console.error(JSON.stringify({
      ...errorResponse,
      requestId: request.headers['x-request-id'],
      stack: exception instanceof Error ? exception.stack : undefined,
    }));

    response.status(status).json(errorResponse);
  }
}