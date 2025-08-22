import { Controller, UseGuards } from '@nestjs/common';
import { ImportService } from './import.service';
import { SimpleJwtAuthGuard } from '../auth/guards/simple-jwt-auth.guard';

@UseGuards(SimpleJwtAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  // TODO: Implement import endpoints
}