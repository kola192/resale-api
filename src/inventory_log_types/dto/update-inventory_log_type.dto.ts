import { PartialType } from '@nestjs/swagger';
import { CreateInventoryLogTypeDto } from './create-inventory_log_type.dto';

export class UpdateInventoryLogTypeDto extends PartialType(CreateInventoryLogTypeDto) {}
