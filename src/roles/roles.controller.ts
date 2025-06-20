import { Controller, Get, Param, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { FindAllRolesDto } from './dto/find-all-roles.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll(@Query() query: FindAllRolesDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }
}
