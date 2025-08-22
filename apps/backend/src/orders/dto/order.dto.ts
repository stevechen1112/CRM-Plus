import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, IsIn, Min, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateOrderDto {
  @ApiProperty({ description: 'Customer phone number', example: '0912345678' })
  @IsString()
  customerPhone: string;

  @ApiProperty({ description: 'Order amount', example: 1000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ 
    description: 'Order status',
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  })
  @IsOptional()
  @IsIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
  status?: string = 'PENDING';

  @ApiProperty({ required: false, description: 'Order description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'Expected delivery date (ISO string)' })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiProperty({ required: false, description: 'Order items (JSON array)' })
  @IsOptional()
  @IsArray()
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    description?: string;
  }>;
}

export class UpdateOrderDto {
  @ApiProperty({ 
    required: false,
    description: 'Order status',
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
  })
  @IsOptional()
  @IsIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
  status?: string;

  @ApiProperty({ required: false, description: 'Order amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ required: false, description: 'Order description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'Expected delivery date (ISO string)' })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiProperty({ required: false, description: 'Order items (JSON array)' })
  @IsOptional()
  @IsArray()
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    description?: string;
  }>;
}

export class OrderQueryDto {
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
    description: 'Filter by status',
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
  })
  @IsOptional()
  @IsIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
  status?: string;

  @ApiProperty({ required: false, description: 'Search in description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Start date for filtering (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for filtering (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Minimum order amount' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiProperty({ required: false, description: 'Maximum order amount' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  maxAmount?: number;
}