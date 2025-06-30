import { Injectable } from '@nestjs/common';
import { UpdateInventoryItemDto } from './dto/update-inventory_item.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ErrorHandlingService } from 'src/shared/error-handling.service';

@Injectable()
export class InventoryItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {}

  async update(id: number, data: UpdateInventoryItemDto) {
    try {
      const existing = await this.prisma.inventory_items.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error(this.i18n.t('inventory_items.update.not_found', {
          lang: I18nContext.current()?.lang,
        }));
      }

      // Optional: Validate log type exists
      const logType = await this.prisma.inventory_log_types.findUnique({
        where: { id: data.inventory_log_type_id },
      });

      if (!logType) {
        throw new Error(this.i18n.t('inventory_items.update.invalid_log_type', {
          lang: I18nContext.current()?.lang,
        }));
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const updatedItem = await tx.inventory_items.update({
          where: { id },
          data: {
            price: data.price ?? existing.price,
            qty: data.qty ?? existing.qty,
          },
        });

        await tx.inventory_item_logs.create({
          data: {
            inventory_item_id: id,
            inventory_log_type_id: data.inventory_log_type_id,
            qty: data.qty ?? updatedItem.qty,
            price: data.price ?? updatedItem.price,
            from_inventory_id: data.from_inventory_id ?? null,
            to_inventory_id: data.to_inventory_id ?? null,
          },
        });

        return updatedItem;
      });

      return {
        data: updated,
        message: this.i18n.t('inventory_items.update.success', {
          lang: I18nContext.current()?.lang,
        }),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }
}
