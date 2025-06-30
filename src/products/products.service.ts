import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { ErrorHandlingService } from 'src/shared/error-handling.service';
import { CreateProductDto } from './dto/create-product.dto';
import { products } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {}

  async create(
    dto: CreateProductDto,
    image: Express.Multer.File,
    images: Express.Multer.File[],
    userId: number,
  ): Promise<{ data: any; message: string }> {
    if (!image) {
      throw new BadRequestException(
        this.i18n.t('validation.products.image_required', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const savedFilenames: string[] = [
      image.filename,
      ...(images || []).map((img) => img.filename),
    ];

    try {
      // Get agent_user
      const agentId = await this.resolveAgentId(userId);

      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.products.create({
          data: {
            name: dto.name,
            descr: dto.descr,
            category_id: dto.category_id,
            is_published: dto.is_published ?? false,
            image: image.filename,
            supplier_id: agentId,
          },
        });

        const inventory = await tx.inventories.findFirst({
          where: { agent_id: agentId },
        });

        const inventoryLogType = await tx.inventory_log_types.findFirst({
          where: {
            code: 'stock_in',
          },
        });

        if (!inventory || !inventoryLogType) {
          throw new BadRequestException(
            this.i18n.t('validation.products.inventory_not_found', {
              lang: I18nContext.current()?.lang,
            }),
          );
        }

        const invnetoryItem = await tx.inventory_items.create({
          data: {
            inventory_id: inventory.id,
            product_id: product.id,
            qty: dto.qty,
            price: dto.price,
          },
        });

        await tx.inventory_item_logs.create({
          data: {
            inventory_item_id: invnetoryItem?.id,
            inventory_log_type_id: inventoryLogType?.id,
            price: dto?.price,
            qty: dto?.qty,
          },
        });

        await tx.product_location.create({
          data: {
            address: dto.address,
            city_id: dto.city_id,
            product_id: product.id,
          },
        });

        if (images?.length) {
          await tx.product_images.createMany({
            data: images.map((img) => ({
              image: img.filename,
              product_id: product.id,
            })),
          });
        }

        return {
          data: product,
          message: this.i18n.t('products.create.success', {
            lang: I18nContext.current()?.lang,
          }),
        };
      });
    } catch (error) {
      // Delete uploaded images if they exist
      await this.removeUploadedFiles(savedFilenames);

      // Central error handling
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async findAllPaginated(
    page: number,
    limit: number,
    userId: number,
    search?: string,
    filterBy?: string,
  ): Promise<{
    data: (products & { hasSale: boolean })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const userRoles = await this.prisma.user_roles.findMany({
        where: { user_id: userId },
        include: { roles: true },
      });

      const roleCodes = userRoles.map((ur) => ur.roles.code);
      const skip = (page - 1) * limit;

      let whereClause: any = {};
      if (roleCodes.includes('SUPPLIER')) {
        whereClause.supplier_id = await this.resolveAgentId(userId);
      }

      if (search) {
        const searchCondition = filterBy
          ? { [filterBy]: { contains: search } }
          : {
              OR: [
                { name: { contains: search } },
                { descr: { contains: search } },
              ],
            };
        whereClause = { ...whereClause, ...searchCondition };
      }

      const [productsList, total] = await this.prisma.$transaction([
        this.prisma.products.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { created: 'desc' },
          include: {
            product_images: true,
            categories: true,
            product_location: {
              include: { cities: true },
            },
            inventory_items: {
              select: { id: true },
            },
          },
        }),
        this.prisma.products.count({ where: whereClause }),
      ]);

      // Collect all inventory item IDs from all products
      const inventoryItemIds = productsList.flatMap((p) =>
        p.inventory_items.map((item) => item.id),
      );

      // Query logs for any of those inventory items
      const inventoryLogs = await this.prisma.inventory_item_logs.findMany({
        where: {
          inventory_item_id: { in: inventoryItemIds },
          OR: [
            { from_inventory_id: { not: null } },
            { to_inventory_id: { not: null } },
          ],
        },
        select: { inventory_item_id: true },
      });

      const logsSet = new Set(
        inventoryLogs.map((log) => log.inventory_item_id),
      );

      const enrichedData = productsList.map((product) => {
        const hasSale = product.inventory_items.some((item) =>
          logsSet.has(item.id),
        );
        // Remove inventory_items from final response if not needed
        const { inventory_items, ...rest } = product;
        return {
          ...rest,
          hasSale,
        };
      });

      return {
        data: enrichedData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async findOne(
    id: number,
  ): Promise<{ data: products & { hasSaleLog: boolean } }> {
    try {
      const product = await this.prisma.products.findUnique({
        where: { id },
        include: {
          product_images: true,
          categories: true,
          product_location: {
            include: {
              cities: true,
            },
          },
          inventory_items: true,
        },
      });

      if (!product) {
        const lang = I18nContext.current()?.lang || 'en';
        throw new NotFoundException(
          this.i18n.t('validation.products.not_found', { lang }),
        );
      }

      const hasSaleLog = await this.hasSaleLog(id);

      return { data: { ...product, hasSaleLog } };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async update(
    id: number,
    dto: UpdateProductDto,
    image?: Express.Multer.File,
    additionalImages: Express.Multer.File[] = [],
  ): Promise<{ data: any; message: string }> {
    const existing = await this.prisma.products.findUnique({
      where: { id },
      include: {
        product_images: true,
        product_location: true,
        inventory_items: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        this.i18n.t('validation.products.not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (await this.hasSaleLog(id)) {
      throw new BadRequestException(
        this.i18n.t('products.update.has_sale', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const filenamesToDelete: string[] = [];

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Handle main image replacement
        if (image) {
          if (existing.image) filenamesToDelete.push(existing.image);

          await tx.products.update({
            where: { id },
            data: {
              image: image.filename,
            },
          });
        }

        // Parse removed_image_ids from dto if present
        let removedImageIds: number[] = [];

        if (dto.removed_image_ids) {
          try {
            removedImageIds = JSON.parse(dto.removed_image_ids as any);
          } catch {
            throw new BadRequestException(
              'Invalid format for removed_image_ids',
            );
          }
        }

        // Handle removal of specific images
        if (removedImageIds.length > 0) {
          const imagesToRemove = existing.product_images.filter((img) =>
            removedImageIds.includes(img.id),
          );

          filenamesToDelete.push(...imagesToRemove.map((img) => img.image));

          await tx.product_images.deleteMany({
            where: {
              id: { in: removedImageIds },
            },
          });
        }

        // Add new additional images
        if (additionalImages.length > 0) {
          await tx.product_images.createMany({
            data: additionalImages.map((img) => ({
              product_id: id,
              image: img.filename,
            })),
          });
        }

        // Update product
        await tx.products.update({
          where: { id },
          data: {
            name: dto.name,
            descr: dto.descr,
            category_id: dto.category_id,
            is_published: dto.is_published ?? false,
          },
        });

        // Update location
        await tx.product_location.updateMany({
          where: { product_id: id },
          data: {
            address: dto.address,
            city_id: dto.city_id,
          },
        });

        // Update inventory
        await tx.inventory_items.updateMany({
          where: { product_id: id },
          data: {
            price: dto.price,
            qty: dto.qty,
          },
        });

        return {
          data: { id },
          message: this.i18n.t('products.update.success', {
            lang: I18nContext.current()?.lang,
          }),
        };
      });
    } catch (error) {
      await this.removeUploadedFiles(filenamesToDelete);
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async remove(id: number): Promise<{ data: products; message: string }> {
    try {
      const { data: product } = await this.findOne(id);

      const inventoryItems = await this.prisma.inventory_items.findMany({
        where: { product_id: id },
      });

      const inventoryItemIds = inventoryItems.map((item) => item.id);

      if (await this.hasSaleLog(id)) {
        throw new BadRequestException(
          this.i18n.t('products.delete.has_sale', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      const images = await this.prisma.product_images.findMany({
        where: { product_id: id },
      });

      // Gather all image filenames to delete later from disk
      const imageFilesToDelete: string[] = [
        ...(product.image ? [product.image] : []),
        ...images.map((img) => img.image),
      ];

      const deletedProduct = await this.prisma.$transaction(async (tx) => {
        await tx.inventory_item_logs.deleteMany({
          where: {
            inventory_item_id: { in: inventoryItemIds },
          },
        });

        await tx.inventory_items.deleteMany({
          where: { product_id: id },
        });

        await tx.product_location.deleteMany({
          where: { product_id: id },
        });

        await tx.suggested_categories.deleteMany({
          where: { product_id: id },
        });

        await tx.product_images.deleteMany({
          where: { product_id: id },
        });

        return await tx.products.delete({
          where: { id },
        });
      });

      // Delete image files from disk after DB deletion
      await this.removeUploadedFiles(imageFilesToDelete);

      return {
        data: deletedProduct,
        message: this.i18n.t('products.delete.success', {
          lang: I18nContext.current()?.lang,
        }),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  // helpers
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

  private async removeUploadedFiles(filenames: string[]) {
    await Promise.all(filenames.map((filename) => this.deleteFile(filename)));
  }

  private async resolveAgentId(userId: number): Promise<number> {
    const agentUser = await this.prisma.agent_users.findFirst({
      where: { user_id: userId },
    });

    if (!agentUser) {
      throw new BadRequestException(
        this.i18n.t('validation.products.agent_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (agentUser.main_user_id === null) {
      return agentUser.agent_id;
    }

    const mainAgentUser = await this.prisma.agent_users.findFirst({
      where: { user_id: agentUser.main_user_id },
    });

    if (!mainAgentUser) {
      throw new BadRequestException(
        this.i18n.t('validation.products.main_agent_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return mainAgentUser.agent_id;
  }

  private async hasSaleLog(productId: number): Promise<boolean> {
    const inventoryItems = await this.prisma.inventory_items.findMany({
      where: { product_id: productId },
      select: { id: true },
    });

    if (inventoryItems.length === 0) return false;

    const inventoryItemIds = inventoryItems.map((item) => item.id);

    const saleLog = await this.prisma.inventory_item_logs.findFirst({
      where: {
        inventory_item_id: { in: inventoryItemIds },
        OR: [
          { from_inventory_id: { not: null } },
          { to_inventory_id: { not: null } },
        ],
      },
      select: { id: true },
    });

    return !!saleLog;
  }
}
