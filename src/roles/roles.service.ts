import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorHandlingService } from 'src/shared/error-handling.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly errorHandlingService: ErrorHandlingService,
    private readonly prisma: PrismaService,
  ) {}
  async findAll(query: { codes?: string[] }) {
    try {
      const roles = await this.prisma.roles.findMany({
        where: query.codes?.length ? { code: { in: query.codes } } : {},
        select: {
          id: true,
          name: true,
          name_en: true,
          code: true,
        },
      });
      return { data: roles };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async findOne(id: number) {
    try {
      const locality = await this.prisma.roles.findUnique({
        where: { id },
      });

      if (!locality) {
        throw new NotFoundException();
      }

      return { data: locality };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }
}
