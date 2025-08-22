import { Module } from '@nestjs/common';
import { ImportSimpleController, ExportSimpleController } from './import-simple.controller';

@Module({
  controllers: [ImportSimpleController, ExportSimpleController],
})
export class ImportExportModule {}