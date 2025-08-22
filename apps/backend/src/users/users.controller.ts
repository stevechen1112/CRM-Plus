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
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, UserQueryDto } from './dto/users.dto';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';
import { ApiResponse as ApiResponseType } from '@crm/shared';

@UseGuards(SimpleJwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseType> {
    const user = await this.usersService.create(createUserDto);
    
    return {
      success: true,
      data: user,
      message: 'User created successfully',
    };
  }

  @Get()
  async findAll(@Query() query: UserQueryDto): Promise<ApiResponseType> {
    const result = await this.usersService.findAll(query);
    
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponseType> {
    const user = await this.usersService.findOne(id);
    
    return {
      success: true,
      data: user,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponseType> {
    const user = await this.usersService.update(id, updateUserDto);
    
    return {
      success: true,
      data: user,
      message: 'User updated successfully',
    };
  }

  @Patch(':id/password')
  async updatePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<ApiResponseType> {
    await this.usersService.updatePassword(id, updatePasswordDto.newPassword);
    
    return {
      success: true,
      message: 'Password updated successfully',
    };
  }

  @Post(':id/revoke-sessions')
  async revokeAllSessions(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponseType> {
    await this.usersService.revokeAllSessions(id);
    
    return {
      success: true,
      message: 'All user sessions revoked successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponseType> {
    await this.usersService.remove(id);
    
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}