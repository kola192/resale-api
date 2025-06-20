import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsPhoneNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { AgentDetailsDto } from './agent-details.dto';
import { AgentUsersDto } from './agent-users.dto';

export class CreateAuthDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.name.required') })
  @IsString({ message: i18nValidationMessage('validation.name.string') })
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.email.required') })
  @IsEmail({}, { message: i18nValidationMessage('validation.email.invalid') })
  email: string;

  @ApiProperty({ example: '+966500000000' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.phone.required') })
  @IsPhoneNumber('SA', {
    message: i18nValidationMessage('validation.phone.invalid'),
  })
  phone: string;

  @ApiProperty({ example: 'strong_password' })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.password.required'),
  })
  @IsString({ message: i18nValidationMessage('validation.password.string') })
  password: string;

  @ApiPropertyOptional({ type: () => AgentDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgentDetailsDto)
  agent_details?: AgentDetailsDto;

  @ApiPropertyOptional({ type: () => AgentUsersDto })
  @ValidateNested()
  @Type(() => AgentUsersDto)
  agent_users?: AgentUsersDto;

  @ApiProperty({ example: 'CUSTOMER' })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.agent_type_code.required'),
  })
  @IsString({
    message: i18nValidationMessage('validation.agent_type_code.string'),
  })
  agent_type_code: string;
}
