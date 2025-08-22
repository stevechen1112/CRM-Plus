import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SimpleJwtAuthGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
      const payload = jwt.verify(token, jwtSecret) as any;
      
      // Attach user info to request - 正規化：統一使用 id 而非 sub
      request.user = {
        id: payload.sub,
        userId: payload.sub, // 保留舊欄位以防相容性問題
        email: payload.email,
        role: payload.role
      };

      return true;
    } catch (error) {
      console.error('JWT verification error:', error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }
}