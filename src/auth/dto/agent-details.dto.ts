import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AgentDetailsDto {
  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('validation.commercial_number.string'),
  })
  commercial_number?: string;
}
