import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';

export const PERMS_KEY = 'perms';
export const RequirePerms = (...perms: string[]) => SetMetadata(PERMS_KEY, perms);

@Injectable()
export class PermsGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const handler = ctx.getHandler() as any;
    const required: string[] = Reflect.getMetadata(PERMS_KEY, handler) ?? [];
    if (!required.length) return true;
    const req = ctx.switchToHttp().getRequest();
    const role = req.user?.role;
    if (!role) throw new ForbiddenException();
    const { can } = require('./permissions');
    for (const p of required) if (!can(role, p)) throw new ForbiddenException('No permission: ' + p);
    return true;
  }
}