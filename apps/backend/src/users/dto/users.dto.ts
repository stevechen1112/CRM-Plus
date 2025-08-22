import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
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

  @ApiProperty({ 
    example: true,
    description: 'Whether the user account is active',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserDto {
  @ApiProperty({ 
    example: 'John Doe',
    description: 'Full name of the user',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    example: 'john@crm.com',
    description: 'User email address',
    required: false
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ 
    enum: UserRole,
    example: UserRole.STAFF,
    description: 'User role',
    required: false
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ 
    example: true,
    description: 'Whether the user account is active',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePasswordDto {
  @ApiProperty({ 
    example: 'newpassword123',
    description: 'New password',
    minLength: 6 
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UserQueryDto {
  @ApiProperty({ 
    example: 1,
    description: 'Page number',
    required: false
  })
  @IsOptional()
  page?: number;

  @ApiProperty({ 
    example: 10,
    description: 'Number of items per page',
    required: false
  })
  @IsOptional()
  limit?: number;

  @ApiProperty({ 
    example: 'john',
    description: 'Search by name or email',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    enum: UserRole,
    description: 'Filter by user role',
    required: false
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ 
    example: true,
    description: 'Filter by active status',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}