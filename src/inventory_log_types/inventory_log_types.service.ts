import { Injectable } from '@nestjs/common';
import { inventory_log_types } from '@prisma/client';
import { ErrorHandlingService } from 'src/shared/error-handling.service';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InventoryLogTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {}

  async findAll(codes?: string[]): Promise<{ data: inventory_log_types[] }> {
    try {
      const data = await this.prisma.inventory_log_types.findMany({
        where: codes?.length ? { code: { in: codes } } : {},
        orderBy: { created: 'desc' },
      });

      return { data };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }
}
