// create-city.dto.ts
import { IsString } from 'class-validator';

export class CreateCityDto {
  @IsString()
  name: string;

  @IsString()
  name_en: string;
}
