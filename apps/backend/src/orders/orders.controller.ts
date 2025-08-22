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
import { OrdersService } from './orders.service';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';
import { CreateOrderDto, UpdateOrderDto, OrderQueryDto } from './dto/order.dto';
import { ApiResponse as ApiResponseType, PaginatedResponse, Order } from '@crm/shared';
import { GetUserIp } from '../common/decorators/get-user-ip.decorator';

@UseGuards(SimpleJwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<Order>> {
    const order = await this.ordersService.create(
      createOrderDto,
      req.user.id,
      userIp,
    );

    return {
      success: true,
      data: order,
    };
  }

  @Get()
  async findAll(
    @Query() query: OrderQueryDto,
  ): Promise<ApiResponseType<PaginatedResponse<Order>>> {
    const result = await this.ordersService.findAll(query);

    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  async getStats(): Promise<ApiResponseType<any>> {
    const stats = await this.ordersService.getOrderStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponseType<Order>> {
    const order = await this.ordersService.findOne(id);

    return {
      success: true,
      data: order,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<Order>> {
    const order = await this.ordersService.update(
      id,
      updateOrderDto,
      req.user.id,
      userIp,
    );

    return {
      success: true,
      data: order,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<null>> {
    await this.ordersService.remove(id, req.user.id, userIp);

    return {
      success: true,
      data: null,
    };
  }

  @Get('customer/:customerPhone')
  async getCustomerOrders(
    @Param('customerPhone') customerPhone: string,
    @Query('limit') limit?: number,
  ): Promise<ApiResponseType<Order[]>> {
    const orders = await this.ordersService.getCustomerOrders(customerPhone, limit);

    return {
      success: true,
      data: orders,
    };
  }
}