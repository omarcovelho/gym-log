import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

   app.enableCors({
        origin: ['http://localhost:5173'], // your Vite dev URL
        credentials: true, // if you ever use cookies/sessions
    });
    app.setGlobalPrefix('api')
   const config = new DocumentBuilder()
    .setTitle('GymLog API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
