import { Test, TestingModule } from '@nestjs/testing';
import { InventoryLogTypesController } from './inventory_log_types.controller';
import { InventoryLogTypesService } from './inventory_log_types.service';

describe('InventoryLogTypesController', () => {
  let controller: InventoryLogTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryLogTypesController],
      providers: [InventoryLogTypesService],
    }).compile();

    controller = module.get<InventoryLogTypesController>(InventoryLogTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
