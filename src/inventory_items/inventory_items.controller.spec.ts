import { Test, TestingModule } from '@nestjs/testing';
import { InventoryItemsController } from './inventory_items.controller';
import { InventoryItemsService } from './inventory_items.service';

describe('InventoryItemsController', () => {
  let controller: InventoryItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryItemsController],
      providers: [InventoryItemsService],
    }).compile();

    controller = module.get<InventoryItemsController>(InventoryItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
