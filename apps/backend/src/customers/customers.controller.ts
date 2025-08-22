import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PermsGuard, RequirePerms } from '../auth/permissions.guard';
import { Roles } from '../auth/roles.decorator';
import { prisma } from '../prisma/prisma.single';
import { PageQueryDto } from '../common/dto/query.dto';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryDto,
  DuplicateCheckDto,
  MergeCustomersDto,
} from './dto/customer.dto';
import { ApiResponse as ApiResponseType, PaginatedResponse, Customer } from '@crm/shared';
import { GetUserIp } from '../common/decorators/get-user-ip.decorator';

@UseGuards(SimpleJwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  private customersService: CustomersService;
  
  constructor() {
    this.customersService = new CustomersService();
  }

  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Post()
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<Customer>> {
    const customer = await this.customersService.create(
      createCustomerDto,
      req.user.id,
      userIp,
    );

    return {
      success: true,
      data: customer,
    };
  }

  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Get()
  async findAll(
    @Query() q: PageQueryDto,
  ): Promise<{items: any[]; total: number}> {
    const page = q.page || 1;
    const pageSize = q.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const whereClause = q.q ? { 
      OR: [
        { name: { contains: q.q, mode: 'insensitive' as any } }, 
        { phone: { contains: q.q } }
      ] 
    } : undefined;
    
    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip, 
        take: pageSize,
      }),
      prisma.customer.count({ where: whereClause }),
    ]);
    return { items, total };
  }

  @Roles('ADMIN', 'MANAGER')
  @Get('stats')
  async getStats(): Promise<ApiResponseType<any>> {
    const stats = await this.customersService.getCustomerStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Roles('ADMIN', 'MANAGER')
  @Post('check-duplicates')
  @HttpCode(HttpStatus.OK)
  async checkDuplicates(
    @Body() duplicateCheckDto: DuplicateCheckDto,
  ): Promise<ApiResponseType<{ nameDuplicates: Customer[] }>> {
    const result = await this.customersService.checkDuplicates(duplicateCheckDto);

    return {
      success: true,
      data: result,
    };
  }

  @UseGuards(SimpleJwtAuthGuard, RolesGuard, PermsGuard)
  @RequirePerms('customers.merge')
  @Post('merge')
  @HttpCode(HttpStatus.OK)
  async mergeCustomers(
    @Body() mergeDto: MergeCustomersDto,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<Customer>> {
    const customer = await this.customersService.mergeCustomers(
      mergeDto,
      req.user.id,
      userIp,
    );

    return {
      success: true,
      data: customer,
    };
  }

  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Get(':phone')
  async findOne(@Param('phone') phone: string): Promise<ApiResponseType<Customer>> {
    const customer = await this.customersService.findOne(phone);

    return {
      success: true,
      data: customer,
    };
  }

  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @Patch(':phone')
  async update(
    @Param('phone') phone: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<Customer>> {
    const customer = await this.customersService.update(
      phone,
      updateCustomerDto,
      req.user.id,
      userIp,
    );

    return {
      success: true,
      data: customer,
    };
  }

  @UseGuards(SimpleJwtAuthGuard, RolesGuard, PermsGuard)
  @RequirePerms('customers.delete')
  @Delete(':phone')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('phone') phone: string,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<null>> {
    await this.customersService.remove(phone, req.user.id, userIp);

    return {
      success: true,
      data: null,
    };
  }
}