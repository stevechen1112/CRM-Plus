import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  BadRequestException,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';
import { Request, Response } from 'express';
import { ImportPreviewService } from './services/import-preview.service';
import { ImportExecutionService } from './services/import-execution.service';
import { ExportService } from './services/export.service';
import {
  ImportPreviewDto,
  ImportCommitDto,
  ImportPreviewResult,
  ImportCommitResult,
  ExportQuery
} from './dto/import.dto';

@Controller('api/v1')
@UseGuards(SimpleJwtAuthGuard)
export class ImportExportController {
  constructor(
    private previewService: ImportPreviewService,
    private executionService: ImportExecutionService,
    private exportService: ExportService
  ) {}

  @Post('import/customers')
  @UseInterceptors(FileInterceptor('file'))
  async importCustomersPreview(
    @UploadedFile() file: Express.Multer.File
  ): Promise<ImportPreviewResult> {
    if (!file) {
      throw new BadRequestException('請選擇要上傳的檔案');
    }

    return this.previewService.parseFile(file, 'customers');
  }

  @Post('import/orders')
  @UseInterceptors(FileInterceptor('file'))
  async importOrdersPreview(
    @UploadedFile() file: Express.Multer.File
  ): Promise<ImportPreviewResult> {
    if (!file) {
      throw new BadRequestException('請選擇要上傳的檔案');
    }

    return this.previewService.parseFile(file, 'orders');
  }

  @Post('import/commit')
  @HttpCode(HttpStatus.OK)
  async commitImport(
    @Body() commitDto: ImportCommitDto,
    @Req() req: Request
  ): Promise<ImportCommitResult> {
    const user = req.user as any;
    return this.executionService.commitImport(
      commitDto.previewId,
      commitDto.upsert,
      user.id
    );
  }

  @Get('export/customers')
  async exportCustomers(
    @Query() query: ExportQuery,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const user = req.user as any;
    const stream = await this.exportService.exportCustomersCSV(query, user.id);
    
    const fileName = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    stream.pipe(res);
  }

  @Get('export/orders')
  async exportOrders(
    @Query() query: ExportQuery,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const user = req.user as any;
    const stream = await this.exportService.exportOrdersCSV(query, user.id);
    
    const fileName = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    stream.pipe(res);
  }

  @Get('export/interactions')
  async exportInteractions(
    @Query() query: ExportQuery,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const user = req.user as any;
    const stream = await this.exportService.exportInteractionsCSV(query, user.id);
    
    const fileName = `interactions_${new Date().toISOString().slice(0, 10)}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    stream.pipe(res);
  }
}