import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorHandlingService } from 'src/shared/error-handling.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, ErrorHandlingService],
})
export class CategoriesModule {}
