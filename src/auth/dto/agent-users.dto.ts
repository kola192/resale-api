import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AgentUsersDto {
  @ApiPropertyOptional({ example: true })
  @IsNotEmpty()
  @IsBoolean({
    message: i18nValidationMessage('validation.is_main_user.boolean'),
  })
  is_main_user?: boolean;
}
