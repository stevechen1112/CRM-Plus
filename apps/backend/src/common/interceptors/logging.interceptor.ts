import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createLogEntry, maskSensitiveData } from '@crm/shared';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    
    // Generate request ID if not exists
    if (!request.headers['x-request-id']) {
      request.headers['x-request-id'] = uuidv4();
    }
    
    const requestId = request.headers['x-request-id'] as string;
    const startTime = Date.now();
    
    // Extract user info (will be available after auth)
    const user = (request as any).user;
    const userId = user?.id || 'anonymous';
    const userIp = request.ip || request.connection.remoteAddress || 'unknown';
    
    // Determine action and entity from route
    const { method, url, route } = request;
    const action = `${method.toLowerCase()}_${route?.path?.replace(/\/api\/v1\//, '') || url}`;
    const pathSegments = url.split('/').filter(segment => segment !== '' && segment !== 'api' && segment !== 'v1');
    const entity = pathSegments[0] || 'unknown';
    const entityId = pathSegments[1] || '';

    return next.handle().pipe(
      tap({
        next: (data) => {
          const latencyMs = Date.now() - startTime;
          
          const logEntry = createLogEntry(
            requestId,
            userId,
            userIp,
            action,
            entity,
            entityId,
            'success',
            latencyMs
          );
          
          console.log(JSON.stringify(logEntry));
        },
        error: (error) => {
          const latencyMs = Date.now() - startTime;
          
          const logEntry = createLogEntry(
            requestId,
            userId,
            userIp,
            action,
            entity,
            entityId,
            'error',
            latencyMs
          );
          
          console.error(JSON.stringify({
            ...logEntry,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }));
        }
      })
    );
  }
}