import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { ErrorHandlingService } from 'src/shared/error-handling.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { cities } from '@prisma/client';

@Injectable()
export class CitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {}

  async create(
    data: CreateCityDto,
  ): Promise<{ data: cities; message: string }> {
    try {
      const city = await this.prisma.cities.create({ data });

      return {
        data: city,
        message: this.i18n.t('cities.create.success', {
          lang: I18nContext.current()?.lang,
        }),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async findAll(search?: string): Promise<{ data: cities[] }> {
    try {
      const data = await this.prisma.cities.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search } },
                { name_en: { contains: search } },
              ],
            }
          : {},
        orderBy: { created: 'desc' },
      });
      return { data };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async paginate(
    page = 1,
    limit = 10,
    search = '',
    filterBy?: string,
  ): Promise<{
    data: cities[];
    total: number;
    page: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      let whereClause = {};
      if (search) {
        if (filterBy) {
          whereClause = {
            [filterBy]: { contains: search, mode: 'insensitive' },
          };
        } else {
          whereClause = {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { name_en: { contains: search, mode: 'insensitive' } },
            ],
          };
        }
      }

      const [data, total] = await this.prisma.$transaction([
        this.prisma.cities.findMany({
          skip,
          take: limit,
          where: whereClause,
          orderBy: { created: 'desc' },
        }),
        this.prisma.cities.count({ where: whereClause }),
      ]);

      return { data, total, page };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async findOne(id: number): Promise<{ data: cities }> {
    try {
      const city = await this.prisma.cities.findUnique({
        where: { id },
      });

      if (!city) {
        throw new NotFoundException(
          this.i18n.t('validation.cities.not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      return { data: city };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async update(
    id: number,
    data: UpdateCityDto,
  ): Promise<{ data: cities; message: string }> {
    try {
      await this.findOne(id); // ensure it exists

      const updated = await this.prisma.cities.update({
        where: { id },
        data,
      });

      return {
        data: updated,
        message: this.i18n.t('cities.update.success', {
          lang: I18nContext.current()?.lang,
        }),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async remove(id: number): Promise<{ data: cities; message: string }> {
    try {
      await this.findOne(id); // ensure it exists

      const deleted = await this.prisma.cities.delete({ where: { id } });

      return {
        data: deleted,
        message: this.i18n.t('cities.delete.success', {
          lang: I18nContext.current()?.lang,
        }),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }
}
