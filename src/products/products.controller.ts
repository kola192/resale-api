import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Delete,
  Patch,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { generateMulterOptions } from 'src/shared/file-upload.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'images', maxCount: 10 },
      ],
      generateMulterOptions(),
    ),
  )
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    @Req() req: any,
  ) {
    const image = files.image?.[0]!; // tell TypeScript: this won't be undefined
    const additionalImages = files.images ?? [];
    const userId = req.user?.sub;

    return this.productsService.create(
      createProductDto,
      image,
      additionalImages,
      +userId,
    );
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search = '',
    @Query('filterBy') filterBy = '',
    @Req() req: any,
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const userId = req.user?.sub;

    return this.productsService.findAllPaginated(
      pageNumber,
      limitNumber,
      +userId,
      search,
      filterBy,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'images', maxCount: 10 },
      ],
      generateMulterOptions(),
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    const image = files?.image?.[0];
    const additionalImages = files?.images ?? [];
    return this.productsService.update(
      +id,
      updateProductDto,
      image,
      additionalImages,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
