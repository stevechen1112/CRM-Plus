import { Body, Controller, Post, Get, Req, UseGuards, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SimpleJwtAuthGuard } from './guards/simple-jwt-auth.guard';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  private prisma = new PrismaClient();

  constructor(private readonly jwt: JwtService) {}

  @Post('_debug')
  async debug(@Body() body: { email: string; password: string }) {
    // 僅在非生產環境下提供 debug 端點
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Debug endpoint not available in production');
    }
    const user = await this.prisma.user.findUnique({ where: { email: body.email }});
    if (!user) return { found:false };
    const ok = await bcrypt.compare(body.password, user.password);
    return { found:true, role:user.role, bcrypt: ok };
  }

  @Post('login')
  async login(@Body() b: { email: string; password: string }) {
    if (!b.email || !b.password) throw new BadRequestException('Missing credentials');
    const user = await this.prisma.user.findUnique({ where: { email: b.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    // 本地環境允許緊急登入（跳過密碼驗證）
    const bypass = process.env.ALLOW_INSECURE_LOGIN === 'true';
    if (bypass) {
      console.log('🚨 INSECURE LOGIN BYPASS ENABLED - NOT FOR PRODUCTION');
    } else {
      const ok = await bcrypt.compare(b.password, user.password);
      if (!ok) throw new UnauthorizedException('Invalid credentials');
    }

    // 生成真實 JWT tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
    
    const { password: _pw, ...safe } = user;
    return { 
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: safe 
      }
    };
  }

  @Get('me') 
  async me() {
    // 簡化版 - 直接返回 admin 用戶信息用於測試
    const user = await this.prisma.user.findUnique({ where: { email: 'admin@crm.com' }});
    if (!user) return { success: false, message: 'User not found' };
    const { password: _pw, ...safe } = user;
    return { success: true, data: safe };
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
      const decoded = jwt.verify(body.refreshToken, jwtSecret) as any;
      
      // 生成新的 access token
      const payload = { sub: decoded.sub, email: decoded.email, role: decoded.role };
      const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
      
      return { success: true, data: { accessToken } };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}