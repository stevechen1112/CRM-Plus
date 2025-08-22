import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum TaskType {
  FOLLOW_UP = 'FOLLOW_UP',
  CARE_CALL = 'CARE_CALL',
  REPURCHASE = 'REPURCHASE',
  BIRTHDAY = 'BIRTHDAY',
  ANNIVERSARY = 'ANNIVERSARY',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  REFUND_PROCESS = 'REFUND_PROCESS',
  OTHER = 'OTHER',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

export class CreateTaskDto {
  @ApiProperty({ description: 'Customer phone number', example: '0912345678' })
  @IsString()
  customerPhone: string;

  @ApiProperty({ required: false, description: 'Related order ID' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({ description: 'Task title', example: '客戶跟進' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, description: 'Task description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Task type',
    enum: TaskType,
    example: TaskType.FOLLOW_UP
  })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({ 
    description: 'Task priority',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @ApiProperty({ description: 'Due date (ISO string)', example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  dueAt: string;

  @ApiProperty({ required: false, description: 'Assigned user ID' })
  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;
}

export class UpdateTaskDto {
  @ApiProperty({ required: false, description: 'Task title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false, description: 'Task description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    required: false,
    description: 'Task type',
    enum: TaskType
  })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiProperty({ 
    required: false,
    description: 'Task priority',
    enum: TaskPriority
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ 
    required: false,
    description: 'Task status',
    enum: TaskStatus
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ required: false, description: 'Due date (ISO string)' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiProperty({ required: false, description: 'Assigned user ID' })
  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;
}

export class TaskQueryDto {
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

  @ApiProperty({ required: false, description: 'Filter by assignee user ID' })
  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Filter by status',
    enum: TaskStatus
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ 
    required: false, 
    description: 'Filter by priority',
    enum: TaskPriority
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ 
    required: false, 
    description: 'Filter by type',
    enum: TaskType
  })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiProperty({ required: false, description: 'Search in title and description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Filter tasks due before this date (ISO string)' })
  @IsOptional()
  @IsDateString()
  dueBefore?: string;

  @ApiProperty({ required: false, description: 'Filter tasks due after this date (ISO string)' })
  @IsOptional()
  @IsDateString()
  dueAfter?: string;

  @ApiProperty({ required: false, description: 'Show only overdue tasks' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  overdue?: boolean;
}

export class CompleteTaskDto {
  @ApiProperty({ required: false, description: 'Completion notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DelayTaskDto {
  @ApiProperty({ description: 'New due date (ISO string)' })
  @IsDateString()
  newDueAt: string;

  @ApiProperty({ required: false, description: 'Reason for delay' })
  @IsOptional()
  @IsString()
  reason?: string;
}