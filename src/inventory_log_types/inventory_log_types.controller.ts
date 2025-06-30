import { Controller, Get, Query } from '@nestjs/common';
import { InventoryLogTypesService } from './inventory_log_types.service';

@Controller('inventory-log-types')
export class InventoryLogTypesController {
  constructor(
    private readonly inventoryLogTypesService: InventoryLogTypesService,
  ) {}

  @Get()
  async getAll(@Query('codes') codes: string) {
    const codeArray = codes ? codes.split(',') : undefined;
    return this.inventoryLogTypesService.findAll(codeArray);
  }
}
