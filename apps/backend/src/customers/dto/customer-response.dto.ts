import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({ example: '0912345678', description: '客戶電話' })
  phone!: string;

  @ApiProperty({ example: '王小明', description: '客戶姓名' })
  name!: string;

  @ApiPropertyOptional({ example: 'wang.xiaoming@example.com', description: '客戶信箱' })
  email?: string;

  @ApiPropertyOptional({ example: 'wang_xiaoming', description: 'LINE ID' })
  lineId?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/wang.xiaoming', description: 'Facebook URL' })
  facebookUrl?: string;

  @ApiPropertyOptional({ example: 'Facebook', description: '客戶來源' })
  source?: string;

  @ApiPropertyOptional({ type: [String], example: ['VIP', '老客戶'], description: '標籤' })
  tags?: string[];

  @ApiPropertyOptional({ example: '台北市', description: '地區' })
  region?: string;

  @ApiPropertyOptional({ type: [String], example: ['產品A', '產品B'], description: '偏好產品' })
  preferredProducts?: string[];

  @ApiPropertyOptional({ type: [String], example: ['信用卡', '現金'], description: '付款方式' })
  paymentMethods?: string[];

  @ApiPropertyOptional({ example: true, description: '行銷同意' })
  marketingConsent?: boolean;

  @ApiPropertyOptional({ example: '重要客戶', description: '備註' })
  notes?: string;

  @ApiProperty({ type: Date, description: '建立時間' })
  createdAt!: Date;

  @ApiProperty({ type: Date, description: '更新時間' })
  updatedAt!: Date;
}