// dto/find-all-roles.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindAllRolesDto {
  @ApiPropertyOptional({
    description: 'List of role codes',
    example: 'CUSTOMER,MANAGER',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((v: string) => v.trim())
      : value,
  )
  codes?: string[];
}
