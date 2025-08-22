import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { SimpleJwtAuthGuard } from './auth/guards/simple-jwt-auth.guard';

@Controller()
export class AppController {
  @Public()
  @Get('/')
  getHello(): string {
    return 'Hello World!';
  }

  @Public()
  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(SimpleJwtAuthGuard)
  @Get('protected')
  getProtected(@Req() req: any): { message: string; user: any } {
    return {
      message: 'Access granted to protected resource',
      user: req.user,
    };
  }
}