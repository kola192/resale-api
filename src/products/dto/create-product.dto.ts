import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  Min,
  IsPositive,
  IsInt,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateProductDto {
  @IsNotEmpty({
    message: i18nValidationMessage('validation.products.name_required'),
  })
  name: string;

  @IsNotEmpty({
    message: i18nValidationMessage('validation.products.descr_required'),
  })
  descr: string;

  @IsNotEmpty({
    message: i18nValidationMessage('validation.products.address_required'),
  })
  address: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: i18nValidationMessage('validation.products.city_id') })
  city_id: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: i18nValidationMessage('validation.products.category_id') })
  category_id: number;

  @IsNumber()
  @Type(() => Number)
  @IsPositive({
    message: i18nValidationMessage('validation.products.price_positive'),
  })
  price: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0, { message: i18nValidationMessage('validation.products.qty_min') })
  qty: number;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({
    message: i18nValidationMessage('validation.products.is_published'),
  })
  is_published: boolean;
}
