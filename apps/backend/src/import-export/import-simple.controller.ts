import { Controller, Get, Post, Body, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';

@UseGuards(SimpleJwtAuthGuard)
@Controller('import')
export class ImportSimpleController {
  @Post('customers/preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewCustomers(@UploadedFile() file: any, @Request() req: any) {
    return { 
      success: true,
      data: {
        previewId: 'preview-' + Date.now(),
        totalRows: 0,
        validRows: 0,
        errorRows: 0,
        preview: [],
        errors: []
      }
    };
  }

  @Post('orders/preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewOrders(@UploadedFile() file: any, @Request() req: any) {
    return { 
      success: true,
      data: {
        previewId: 'preview-' + Date.now(),
        totalRows: 0,
        validRows: 0,
        errorRows: 0,
        preview: [],
        errors: []
      }
    };
  }

  @Post('commit')
  async commitImport(@Body() body: any, @Request() req: any) {
    return { 
      success: true,
      data: {
        successfulRows: 0,
        errorRows: 0,
        ignoredRows: 0,
        duplicatesHandled: 0
      }
    };
  }
}

@UseGuards(SimpleJwtAuthGuard)
@Controller('export')
export class ExportSimpleController {
  @Get('customers')
  async exportCustomers(@Request() req: any) {
    return { success: true, message: '客戶資料匯出成功' };
  }

  @Get('orders')
  async exportOrders(@Request() req: any) {
    return { success: true, message: '訂單資料匯出成功' };
  }

  @Get('interactions')
  async exportInteractions(@Request() req: any) {
    return { success: true, message: '交流記錄匯出成功' };
  }
}