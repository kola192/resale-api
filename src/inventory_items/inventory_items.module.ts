import { Module } from '@nestjs/common';
import { InventoryItemsService } from './inventory_items.service';
import { InventoryItemsController } from './inventory_items.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorHandlingService } from 'src/shared/error-handling.service';

@Module({
  controllers: [InventoryItemsController],
  providers: [InventoryItemsService, PrismaService, ErrorHandlingService],
})
export class InventoryItemsModule {}
