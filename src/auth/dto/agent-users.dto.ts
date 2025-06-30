import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AgentUsersDto {
  @ApiPropertyOptional({
    example: 123,
    description: 'Optional ID of the main user',
  })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.main_user_id.number') })
  main_user_id?: number | null;
}
