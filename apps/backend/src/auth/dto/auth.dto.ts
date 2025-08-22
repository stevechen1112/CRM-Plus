import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class LoginRequestDto {
  @ApiProperty({ 
    example: 'admin@crm.com',
    description: 'User email address' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'admin123',
    description: 'User password',
    minLength: 6 
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ 
    description: 'Refresh token for obtaining new access token' 
  })
  @IsString()
  refreshToken: string;
}

export class RegisterRequest {
  @ApiProperty({ 
    example: 'John Doe',
    description: 'Full name of the user' 
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    example: 'john@crm.com',
    description: 'User email address' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'User password',
    minLength: 6 
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    enum: UserRole,
    example: UserRole.STAFF,
    description: 'User role',
    required: false
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}