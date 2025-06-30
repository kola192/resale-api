// update-inventory-item.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryItemDto } from './create-inventory_item.dto';
import { IsInt, IsOptional } from 'class-validator';

export class UpdateInventoryItemDto extends PartialType(
  CreateInventoryItemDto,
) {
  @IsInt()
  inventory_log_type_id: number;

  @IsOptional()
  @IsInt()
  from_inventory_id?: number;

  @IsOptional()
  @IsInt()
  to_inventory_id?: number;
}
