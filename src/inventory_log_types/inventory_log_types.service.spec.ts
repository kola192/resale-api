import { Test, TestingModule } from '@nestjs/testing';
import { InventoryLogTypesService } from './inventory_log_types.service';

describe('InventoryLogTypesService', () => {
  let service: InventoryLogTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryLogTypesService],
    }).compile();

    service = module.get<InventoryLogTypesService>(InventoryLogTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
