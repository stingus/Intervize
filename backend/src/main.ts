import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bull';
import { BullBoardAuthMiddleware } from './bull-board/bull-board.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Security - Helmet (with CSP disabled for Bull Board UI)
  app.use(
    helmet.default({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // CORS Configuration
  const allowedOrigins = configService
    .get<string>('CORS_ALLOWED_ORIGINS', 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global Prefix
  app.setGlobalPrefix('api');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Bull Board Setup
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  // Get the email queue from the app
  const emailQueue = app.get<Queue>('BullQueue_email');

  createBullBoard({
    queues: [new BullAdapter(emailQueue)],
    serverAdapter: serverAdapter,
  });

  // Get Bull Board auth middleware
  const bullBoardAuthMiddleware = app.get(BullBoardAuthMiddleware);

  // Apply authentication middleware to Bull Board routes
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(
    '/admin/queues',
    (req: any, res: any, next: any) => bullBoardAuthMiddleware.use(req, res, next),
    serverAdapter.getRouter(),
  );

  logger.log('Bull Board UI available at /admin/queues (Admin only)');

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
  logger.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
  logger.log(`Bull Board: http://localhost:${port}/admin/queues`);
}

bootstrap();
