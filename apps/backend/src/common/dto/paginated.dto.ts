import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponse<T> {
  @ApiProperty({ type: Number, description: '總記錄數' })
  total!: number;

  @ApiProperty({ isArray: true, description: '資料項目' })
  items!: T[];
}