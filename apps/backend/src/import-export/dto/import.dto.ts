import { IsBoolean, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FieldMappingDto {
  @ApiProperty({ description: '目標欄位名稱' })
  @IsString()
  targetField: string;

  @ApiProperty({ description: '來源欄位名稱' })
  @IsString()
  sourceField: string;

  @ApiProperty({ description: '是否為必填欄位' })
  @IsBoolean()
  required: boolean;
}

export class ImportPreviewDto {
  @ApiProperty({ description: '檔案名稱' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: '資料類型', enum: ['customers', 'orders'], enumName: 'ImportDataType' })
  @IsString()
  dataType: 'customers' | 'orders';

  @ApiProperty({ description: '是否允許 upsert', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  upsert?: boolean = false;

  @ApiProperty({ description: '欄位對應', type: [FieldMappingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  fieldMappings: FieldMappingDto[];
}

export class ImportCommitDto {
  @ApiProperty({ description: '預覽會話 ID' })
  @IsString()
  previewId: string;

  @ApiProperty({ description: '是否允許 upsert', default: false })
  @IsOptional()
  @IsBoolean()
  upsert?: boolean = false;
}

export interface ImportValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
}

export interface ImportPreviewResult {
  previewId: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: ImportValidationError[];
  sampleValidData: any[];
  sampleInvalidData: any[];
  detectedColumns: string[];
  suggestedMappings: FieldMappingDto[];
}

export interface ImportCommitResult {
  success: boolean;
  fileName: string;
  totalRows: number;
  successfulRows: number;
  ignoredRows: number;
  errorRows: number;
  errors: ImportValidationError[];
  duplicatesHandled: number;
  duration: number;
}

export interface ExportQuery {
  format?: 'csv';
  // Customer filters
  source?: string;
  city?: string;
  hasOrders?: boolean;
  hasInteractions?: boolean;
  // Order filters
  paymentStatus?: string;
  orderStatus?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  // Interaction filters
  channel?: string;
  userId?: string;
}