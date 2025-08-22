import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsUUID, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateInteractionDto {
  @ApiProperty({ description: 'Customer phone number', example: '0912345678' })
  @IsString()
  customerPhone: string;

  @ApiProperty({ 
    description: 'Communication channel',
    enum: ['PHONE', 'EMAIL', 'LINE', 'FACEBOOK', 'IN_PERSON', 'OTHER'],
    example: 'PHONE'
  })
  @IsIn(['PHONE', 'EMAIL', 'LINE', 'FACEBOOK', 'IN_PERSON', 'OTHER'])
  channel: string;

  @ApiProperty({ description: 'Interaction summary', example: '客戶詢問產品規格' })
  @IsString()
  summary: string;

  @ApiProperty({ required: false, description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Attachment file URLs or references',
    type: [String],
    example: ['https://example.com/file1.pdf', 'attachment-id-123']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class UpdateInteractionDto {
  @ApiProperty({ 
    required: false,
    description: 'Communication channel',
    enum: ['PHONE', 'EMAIL', 'LINE', 'FACEBOOK', 'MEETING', 'OTHER']
  })
  @IsOptional()
  @IsIn(['PHONE', 'EMAIL', 'LINE', 'FACEBOOK', 'IN_PERSON', 'OTHER'])
  channel?: string;

  @ApiProperty({ required: false, description: 'Interaction summary' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ required: false, description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Attachment file URLs or references',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class InteractionQueryDto {
  @ApiProperty({ required: false, description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({ required: false, description: 'Items per page', default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiProperty({ required: false, description: 'Filter by customer phone' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Filter by channel',
    enum: ['PHONE', 'EMAIL', 'LINE', 'FACEBOOK', 'MEETING', 'OTHER']
  })
  @IsOptional()
  @IsIn(['PHONE', 'EMAIL', 'LINE', 'FACEBOOK', 'IN_PERSON', 'OTHER'])
  channel?: string;

  @ApiProperty({ required: false, description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ required: false, description: 'Search in summary and notes' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Start date for filtering (ISO string)' })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for filtering (ISO string)' })
  @IsOptional()
  endDate?: string;
}