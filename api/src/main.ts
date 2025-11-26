import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { readFileSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // CORS configuration with environment variable support
  const frontendUrl = process.env.FRONTEND_URL;
  const origins = frontendUrl
    ? frontendUrl.split(',').map((url) => url.trim())
    : ['http://localhost:5173'];

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Rejeita requisições com propriedades extras
      transform: true, // Transforma tipos automaticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filters
  app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter());

  app.setGlobalPrefix('api');
  
  // Swagger only in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf8')
    );
    const config = new DocumentBuilder()
      .setTitle('GymLog API')
      .setVersion(packageJson.version)
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, doc);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
