import { IsInt, IsOptional, IsString, Min, Transform } from 'class-validator';

export class PageQueryDto {
  @IsOptional() 
  @Transform(({ value }) => parseInt(value) || 1)
  @IsInt() 
  @Min(1) 
  page: number = 1;

  @IsOptional() 
  @Transform(({ value }) => parseInt(value) || 20)
  @IsInt() 
  @Min(1) 
  pageSize: number = 20;

  @IsOptional() 
  @IsString() 
  sortBy: string = 'createdAt';

  @IsOptional() 
  @IsString() 
  sortOrder: 'asc'|'desc' = 'desc';

  @IsOptional() 
  @IsString() 
  q?: string;
}