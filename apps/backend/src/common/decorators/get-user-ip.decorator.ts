import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.ip || request.connection.remoteAddress || 'unknown';
  },
);