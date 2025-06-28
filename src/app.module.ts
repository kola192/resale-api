import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

import { ServeStaticModule } from '@nestjs/serve-static';
import { HttpModule } from '@nestjs/axios';
import { join } from 'path';
import {
  I18nModule,
  AcceptLanguageResolver,
  HeaderResolver,
  I18nContext,
} from 'nestjs-i18n';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RolesModule } from './roles/roles.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    HttpModule,
    ConfigModule.forRoot(),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: join(process.cwd(), 'src', 'i18n'),
        watch: true,
      },
      resolvers: [
        { use: HeaderResolver, options: ['accepted-language'] },
        AcceptLanguageResolver,
      ],
    }),
    RolesModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    I18nContext,
    {
      provide: APP_INTERCEPTOR,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
