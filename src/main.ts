import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { originList, PORT } from './shared/constatns';
import { I18nService } from 'nestjs-i18n';
import { I18nMiddleware } from 'nestjs-i18n';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1', { exclude: ['/'] });
  // Swagger config

  const config = new DocumentBuilder()
    .setTitle('Resale Api')
    .setDescription('API documentation for resale')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Docs available at /api-docs

  app.enableCors({
    origin: originList,
    credentials: true,
  });
  app.use(cookieParser());
  app.use(I18nMiddleware);
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw an exception for unknown properties
      transform: true,
    }),
  );
  const i18nService =
    app.get<I18nService<Record<string, unknown>>>(I18nService);
  app.useGlobalFilters(
    new HttpExceptionFilter(i18nService),
    new I18nValidationExceptionFilter({
      detailedErrors: false,
    }),
  );

  await app.listen(process.env.PORT ?? PORT);
}
void bootstrap();
