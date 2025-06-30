import { Controller, Body, Patch, Param } from '@nestjs/common';
import { InventoryItemsService } from './inventory_items.service';
import { UpdateInventoryItemDto } from './dto/update-inventory_item.dto';

@Controller('inventory-items')
export class InventoryItemsController {
  constructor(private readonly inventoryItemsService: InventoryItemsService) {}

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
  ) {
    return this.inventoryItemsService.update(+id, updateInventoryItemDto);
  }
}
