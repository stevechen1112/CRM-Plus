import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Health check endpoint (lightweight, zero dependencies)
  app.use('/api/v1/health', (req: any, res: any) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'crm-backend'
    });
  });

  // Swagger temporarily disabled for debugging
  // if (process.env.ENABLE_SWAGGER === 'true') {
  //   const cfg = new DocumentBuilder().setTitle('CRM API').setVersion('1.0').addBearerAuth().build();
  //   const doc = SwaggerModule.createDocument(app, cfg, {
  //     include: [AuthModule],
  //     extraModels: [],
  //   });
  //   SwaggerModule.setup('/api', app, doc);
  // }

  const port = configService.get('PORT', 8080);
  await app.listen(port);
  
  console.log(`🚀 CRM Backend API is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
}

bootstrap();