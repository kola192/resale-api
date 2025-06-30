import { Module } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CitiesController } from './cities.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorHandlingService } from 'src/shared/error-handling.service';

@Module({
  controllers: [CitiesController],
  providers: [CitiesService, PrismaService, ErrorHandlingService],
})
export class CitiesModule {}
