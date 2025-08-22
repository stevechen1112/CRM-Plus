import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';
import { StatsStubService } from './stats-stub.service';
import { DateRangeDto } from './dto/stats.dto';

@Controller('stats')
@UseGuards(SimpleJwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsStubService) {}

  @Get('customers')
  async getCustomerStats(@Query() dateRange: DateRangeDto) {
    return this.statsService.getCustomerStats(dateRange);
  }

  @Get('orders')
  async getOrderStats(@Query() dateRange: DateRangeDto) {
    return this.statsService.getOrderStats(dateRange);
  }

  @Get('interactions')
  async getInteractionStats(@Query() dateRange: DateRangeDto) {
    return this.statsService.getInteractionStats(dateRange);
  }

  @Get('tasks')
  async getTaskStats(@Query() dateRange: DateRangeDto) {
    return this.statsService.getTaskStats(dateRange);
  }
}