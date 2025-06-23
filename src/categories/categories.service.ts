import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { ErrorHandlingService } from 'src/shared/error-handling.service';
import * as fs from 'fs';
import * as path from 'path';
import { categories } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {}

  async create(
    data: CreateCategoryDto,
  ): Promise<{ data: categories; message: string }> {
    try {
      const category = await this.prisma.categories.create({
        data: {
          ...data,
          parent_id: data?.parent_id ?? null,
        },
      });
      return {
        data: category,
        message: this.i18n.t('categories.create.success', {
          lang: I18nContext.current()?.lang,
        }),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async findAll(search?: string): Promise<{ data: categories[] }> {
    try {
      const data = await this.prisma.categories.findMany({
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
    data: categories[];
    total: number;
    page: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      // Build dynamic where clause
      let whereClause = {};
      if (search) {
        if (filterBy) {
          whereClause = {
            [filterBy]: { contains: search },
          };
        } else {
          whereClause = {
            OR: [
              { name: { contains: search } },
              { name_en: { contains: search } },
            ],
          };
        }
      }

      const [data, total] = await this.prisma.$transaction([
        this.prisma.categories.findMany({
          skip,
          take: limit,
          where: whereClause,
          orderBy: { created: 'desc' },
        }),
        this.prisma.categories.count({ where: whereClause }),
      ]);

      return { data, total, page };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async findOne(id: number): Promise<{ data: categories }> {
    try {
      const category = await this.prisma.categories.findUnique({
        where: { id },
      });

      if (!category) {
        throw new NotFoundException(
          this.i18n.t('validation.categories.not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      return { data: category };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async update(id: number, data: UpdateCategoryDto) {
    try {
      const { data: existing } = await this.findOne(id);

      if (data.image && existing.image && data.image !== existing.image) {
        await this.deleteFile(existing.image);
      }

      const updated = await this.prisma.categories.update({
        where: { id },
        data,
      });

      return {
        data: updated,
        message: this.i18n.t('categories.update.success', {
          lang: I18nContext.current()?.lang,
        }),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async remove(id: number): Promise<{ data: categories; message: string }> {
    try {
      const { data: existing } = await this.findOne(id);

      if (existing.image) {
        await this.deleteFile(existing.image);
      }

      const deleted = await this.prisma.categories.delete({ where: { id } });

      return {
        data: deleted,
        message: this.i18n.t('categories.delete.success', {
          lang: I18nContext.current()?.lang,
        }),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  private async deleteFile(filename: string) {
    const filePath = path.resolve('public', 'uploads', filename);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.warn('Error deleting file:', error.message);
    }
  }
}
