import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { SimpleJwtAuthGuard } from './guards/simple-jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { PermsGuard } from './permissions.guard';
import { PrismaService } from '../common/services/prisma.service';
import { UsersService } from '../users/users.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') ?? '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    SimpleJwtAuthGuard,
    RolesGuard,
    PermsGuard,
    UsersService,
  ],
  exports: [AuthService, JwtModule, SimpleJwtAuthGuard, RolesGuard, PermsGuard],
})
export class AuthModule {}