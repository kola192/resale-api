import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { ErrorHandlingService } from 'src/shared/error-handling.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService, ErrorHandlingService, PrismaService],
})
export class RolesModule {}
