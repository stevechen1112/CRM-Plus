import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || configService?.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    // 回傳的內容會注入到 req.user
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}