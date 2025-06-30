// src/inventory-items/dto/create-inventory-item.dto.ts

import { IsInt, IsNumber, Min } from 'class-validator';

export enum InventoryLogType {
  STOCK_IN = 'stock_in',
  DAMAGE = 'damage',
  RETURN = 'return',
}

export class CreateInventoryItemDto {
  @IsInt()
  inventory_id: number;

  @IsInt()
  product_id: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  qty: number;
}
