import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const required = Reflect.getMetadata(ROLES_KEY, ctx.getHandler()) || 
                     Reflect.getMetadata(ROLES_KEY, ctx.getClass());
    if (!required || required.length === 0) return true;
    const { user } = ctx.switchToHttp().getRequest();
    if (!user?.role) throw new ForbiddenException('No role');
    if (!required.includes(user.role)) throw new ForbiddenException('Forbidden');
    return true;
  }
}