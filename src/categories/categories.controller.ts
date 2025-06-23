import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
// import { multerOptions } from 'src/shared/services/file-upload.service';

import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { generateMulterOptions } from 'src/shared/file-upload.service';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('image', generateMulterOptions()))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedResponse({ description: 'Category created successfully' })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.categoriesService.create({
      ...createCategoryDto,
      image: image?.filename || null,
    });
  }

  @Get()
  @ApiOkResponse({
    description: 'List of categories',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query('search') search: string) {
    return this.categoriesService.findAll(search);
  }

  @Get('paginate')
  @UseGuards(AccessTokenGuard)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'filterBy', required: false, type: String })
  paginate(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('filterBy') filterBy?: string,
  ) {
    return this.categoriesService.paginate(+page, +limit, search, filterBy);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Get single category' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('image', generateMulterOptions()))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateCategoryDto })
  @ApiCreatedResponse({ description: 'Category updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.categoriesService.update(+id, {
      ...updateCategoryDto,
      image: image?.filename || undefined,
    });
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  @ApiOkResponse({ description: 'Category deleted successfully' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
