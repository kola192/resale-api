import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class SignInDto {
  @ApiProperty({
    description: 'User email address.',
    required: true,
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.email.required') })
  @IsEmail({}, { message: i18nValidationMessage('validation.email.invalid') })
  email: string;

  @ApiProperty({
    description: 'User password.',
    required: true,
    example: 'strong_password',
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.password.required'),
  })
  @IsString({ message: i18nValidationMessage('validation.password.string') })
  password: string;
}
