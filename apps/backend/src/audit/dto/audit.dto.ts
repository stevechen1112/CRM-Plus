import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuditLogQueryDto {
  @ApiProperty({ required: false, description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, description: 'Items per page', default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ required: false, description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, description: 'Filter by action' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({ required: false, description: 'Filter by entity' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({ required: false, description: 'Start date filter (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date filter (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}