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
import { InteractionsService } from './interactions.service';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';
import { CreateInteractionDto, UpdateInteractionDto, InteractionQueryDto } from './dto/interaction.dto';
import { ApiResponse as ApiResponseType, PaginatedResponse, Interaction } from '@crm/shared';
import { GetUserIp } from '../common/decorators/get-user-ip.decorator';

@UseGuards(SimpleJwtAuthGuard)
@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  async create(
    @Body() createInteractionDto: CreateInteractionDto,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<Interaction>> {
    const interaction = await this.interactionsService.create(
      createInteractionDto,
      req.user.id,
      userIp,
    );

    return {
      success: true,
      data: interaction,
    };
  }

  @Get()
  async findAll(
    @Query() query: InteractionQueryDto,
  ): Promise<ApiResponseType<PaginatedResponse<Interaction>>> {
    const result = await this.interactionsService.findAll(query);

    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  async getStats(): Promise<ApiResponseType<any>> {
    const stats = await this.interactionsService.getInteractionStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponseType<Interaction>> {
    const interaction = await this.interactionsService.findOne(id);

    return {
      success: true,
      data: interaction,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInteractionDto: UpdateInteractionDto,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<Interaction>> {
    const interaction = await this.interactionsService.update(
      id,
      updateInteractionDto,
      req.user.id,
      userIp,
    );

    return {
      success: true,
      data: interaction,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<null>> {
    await this.interactionsService.remove(id, req.user.id, userIp);

    return {
      success: true,
      data: null,
    };
  }

  @Get('customer/:customerPhone')
  async getCustomerInteractions(
    @Param('customerPhone') customerPhone: string,
    @Query('limit') limit?: number,
  ): Promise<ApiResponseType<Interaction[]>> {
    const interactions = await this.interactionsService.getCustomerInteractions(customerPhone, limit);

    return {
      success: true,
      data: interactions,
    };
  }
}