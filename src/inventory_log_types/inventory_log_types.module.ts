import { Module } from '@nestjs/common';
import { InventoryLogTypesService } from './inventory_log_types.service';
import { InventoryLogTypesController } from './inventory_log_types.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorHandlingService } from 'src/shared/error-handling.service';

@Module({
  controllers: [InventoryLogTypesController],
  providers: [InventoryLogTypesService, PrismaService, ErrorHandlingService],
})
export class InventoryLogTypesModule {}
