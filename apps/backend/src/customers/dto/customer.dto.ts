import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsDateString, Matches, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer phone number (Taiwan format)', example: '0912345678' })
  @IsString()
  @Matches(/^09\d{8}$/, { message: 'Phone must be Taiwan format (09xxxxxxxx)' })
  phone: string;

  @ApiProperty({ description: 'Customer name', example: '王小明' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'Customer email', example: 'example@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: 'Customer address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, description: 'Customer birthday (ISO date)' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiProperty({ required: false, description: 'Customer company' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ required: false, description: 'Customer title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false, description: 'Customer notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'Customer tags (JSON array)' })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ 
    required: false, 
    description: 'Customer source', 
    example: 'Facebook',
    default: 'OTHER'
  })
  @IsOptional()
  @IsOptional()
  source?: string = 'OTHER';
}

export class UpdateCustomerDto {
  @ApiProperty({ required: false, description: 'Customer name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: 'Customer email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: 'Customer address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, description: 'Customer birthday (ISO date)' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiProperty({ required: false, description: 'Customer company' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ required: false, description: 'Customer title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false, description: 'Customer notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'Customer tags (JSON array)' })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ 
    required: false, 
    description: 'Customer source', 
    enum: ['REFERRAL', 'WEBSITE', 'SOCIAL_MEDIA', 'ADVERTISEMENT', 'COLD_CALL', 'OTHER']
  })
  @IsOptional()
  @IsOptional()
  source?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Customer status', 
    enum: ['ACTIVE', 'INACTIVE', 'POTENTIAL', 'BLACKLISTED']
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'POTENTIAL', 'BLACKLISTED'])
  status?: string;
}

export class CustomerQueryDto {
  @ApiProperty({ required: false, description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({ required: false, description: 'Items per page', default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiProperty({ required: false, description: 'Search by name or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Filter by status', 
    enum: ['ACTIVE', 'INACTIVE', 'POTENTIAL', 'BLACKLISTED']
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'POTENTIAL', 'BLACKLISTED'])
  status?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Filter by source', 
    enum: ['REFERRAL', 'WEBSITE', 'SOCIAL_MEDIA', 'ADVERTISEMENT', 'COLD_CALL', 'OTHER']
  })
  @IsOptional()
  @IsOptional()
  source?: string;

  @ApiProperty({ required: false, description: 'Filter by company' })
  @IsOptional()
  @IsString()
  company?: string;
}

export class DuplicateCheckDto {
  @ApiProperty({ description: 'Customer name for duplicate check', example: '王小明' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'Customer phone (exclude from check)' })
  @IsOptional()
  @IsString()
  @Matches(/^09\d{8}$/, { message: 'Phone must be Taiwan format (09xxxxxxxx)' })
  excludePhone?: string;
}

export class MergeCustomersDto {
  @ApiProperty({ description: 'Primary customer phone (data will be kept)' })
  @IsString()
  @Matches(/^09\d{8}$/, { message: 'Phone must be Taiwan format (09xxxxxxxx)' })
  primaryPhone: string;

  @ApiProperty({ description: 'Secondary customer phones (data will be merged and deleted)' })
  @IsString({ each: true })
  @Matches(/^09\d{8}$/, { each: true, message: 'All phones must be Taiwan format (09xxxxxxxx)' })
  secondaryPhones: string[];

  @ApiProperty({ required: false, description: 'Fields to merge from secondary customers' })
  @IsOptional()
  mergeFields?: {
    email?: boolean;
    address?: boolean;
    company?: boolean;
    title?: boolean;
    notes?: boolean;
    tags?: boolean;
  };
}