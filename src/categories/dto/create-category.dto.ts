import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'إلكترونيات' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.name.required') })
  @IsString({ message: i18nValidationMessage('validation.name.string') })
  name: string;

  @ApiProperty({ example: 'Electronics' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.name_en.required') })
  @IsString({ message: i18nValidationMessage('validation.name_en.string') })
  name_en: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    { message: i18nValidationMessage('validation.parent_id.number') },
  )
  parent_id?: number;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Image file for the category',
  })
  @IsOptional()
  @IsString()
  image: any;
}
