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
import { TasksService } from './tasks.service';
import { AutomationService } from './automation.service';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';
import { 
  CreateTaskDto, 
  UpdateTaskDto, 
  TaskQueryDto,
  CompleteTaskDto,
  DelayTaskDto,
} from './dto/task.dto';
import { ApiResponse as ApiResponseType, PaginatedResponse, Task } from '@crm/shared';
import { GetUserIp } from '../common/decorators/get-user-ip.decorator';

@UseGuards(SimpleJwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly automationService: AutomationService,
  ) {}

  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<Task>> {
    const task = await this.tasksService.create(
      createTaskDto,
      req.user.id,
      userIp,
    );

    return {
      success: true,
      data: task,
    };
  }

  @Get()
  async findAll(
    @Query() query: TaskQueryDto,
  ): Promise<ApiResponseType<PaginatedResponse<Task>>> {
    const result = await this.tasksService.findAll(query);

    return {
      success: true,
      data: result,
    };
  }

  @Get('my-tasks')
  async getMyTasks(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<ApiResponseType<Task[]>> {
    const tasks = await this.tasksService.getUserTasks(req.user.id, limit);

    return {
      success: true,
      data: tasks,
    };
  }

  @Get('stats')
  async getStats(): Promise<ApiResponseType<any>> {
    const stats = await this.tasksService.getTaskStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Post('automation/trigger')
  @HttpCode(HttpStatus.OK)
  async triggerAutomation(): Promise<ApiResponseType<null>> {
    await this.automationService.processAutomationRules();

    return {
      success: true,
      data: null,
      message: 'Automation rules triggered successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponseType<Task>> {
    const task = await this.tasksService.findOne(id);

    return {
      success: true,
      data: task,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<Task>> {
    const task = await this.tasksService.update(
      id,
      updateTaskDto,
      req.user.id,
      userIp,
    );

    return {
      success: true,
      data: task,
    };
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @Param('id') id: string,
    @Body() completeTaskDto: CompleteTaskDto,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<Task>> {
    const task = await this.tasksService.complete(
      id,
      completeTaskDto,
      req.user.id,
      userIp,
    );

    return {
      success: true,
      data: task,
      message: 'Task completed successfully',
    };
  }

  @Post(':id/delay')
  @HttpCode(HttpStatus.OK)
  async delay(
    @Param('id') id: string,
    @Body() delayTaskDto: DelayTaskDto,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<Task>> {
    const task = await this.tasksService.delay(
      id,
      delayTaskDto,
      req.user.id,
      userIp,
    );

    return {
      success: true,
      data: task,
      message: 'Task delayed successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Request() req: any,
    @GetUserIp() userIp: string,
  ): Promise<ApiResponseType<null>> {
    await this.tasksService.remove(id, req.user.id, userIp);

    return {
      success: true,
      data: null,
      message: 'Task deleted successfully',
    };
  }
}