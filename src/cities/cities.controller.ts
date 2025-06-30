import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@ApiTags('Cities')
@ApiBearerAuth()
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Post()
  @ApiBody({ type: CreateCityDto })
  @ApiCreatedResponse({ description: 'City created successfully' })
  create(@Body() createCityDto: CreateCityDto) {
    return this.citiesService.create(createCityDto);
  }

  @Get()
  @ApiOkResponse({ description: 'List of cities' })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query('search') search: string) {
    return this.citiesService.findAll(search);
  }

  @Get('paginate')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'filterBy', required: false, type: String })
  @ApiOkResponse({ description: 'Paginated list of cities' })
  paginate(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('filterBy') filterBy?: string,
  ) {
    return this.citiesService.paginate(+page, +limit, search, filterBy);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Get single city' })
  @ApiNotFoundResponse({ description: 'City not found' })
  findOne(@Param('id') id: string) {
    return this.citiesService.findOne(+id);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateCityDto })
  @ApiOkResponse({ description: 'City updated successfully' })
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.citiesService.update(+id, updateCityDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'City deleted successfully' })
  remove(@Param('id') id: string) {
    return this.citiesService.remove(+id);
  }
}
