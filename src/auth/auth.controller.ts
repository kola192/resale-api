import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { RefreshTokenGuard } from 'src/common/guards/refreshToken.guard';
import { Response } from 'express';
import { RequestWithUser } from './request-with-user.interface';

import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignInDto } from './dto/sign-in.dto';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signin')
  @ApiBody({ type: SignInDto })
  @ApiOkResponse({
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhaG1lZEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwNDA1MzcsImV4cCI6MTczNzA0NDEzN30.spQheX05UdyIwAuH_yBcH1AaQTUpDOoGrtTYP7LEYsU',
        },
        refresh_token: {
          type: 'string',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhaG1lZEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwNDA1MzcsImV4cCI6MTczNzA0NDEzN30.spQheX05UdyIwAuH_yBcH1AaQTUpDOoGrtTYP7LEYsU',
        },
        data: { $ref: '#/components/schemas/CreateUserDto' },
        message: { type: 'string', example: 'Login success' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  signin(@Body() data: SignInDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.signIn(data, res);
  }

  @Post('signup')
  @ApiBody({ type: CreateAuthDto })
  @ApiOkResponse({
    description: 'Registration successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'your-access-token' },
        refresh_token: { type: 'string', example: 'your-refresh-token' },
        data: { $ref: '#/components/schemas/CreateUserDto' },
        message: { type: 'string', example: 'Registration successful' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'User already exists or validation failed',
  })
  async signup(
    @Body() createUserDto: CreateAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.signUp(createUserDto, res);
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  @ApiOkResponse({
    description:
      'Tokens refreshed successfully. **Note:** The refresh token is expected to be present in an HTTP-only cookie.',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhaG1lZEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwNDA1MzcsImV4cCI6MTczNzA0NDEzN30.spQheX05UdyIwAuH_yBcH1AaQTUpDOoGrtTYP7LEYsU',
        },
        refresh_token: {
          type: 'string',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhaG1lZEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwNDA1MzcsImV4cCI6MTczNzA0NDEzN30.spQheX05UdyIwAuH_yBcH1AaQTUpDOoGrtTYP7LEYsU',
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Invalid refresh token' })
  refreshTokens(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshTokens(
      +req.user['sub'],
      req?.user['refreshToken'],
      res,
    );
  }

  @UseGuards(AccessTokenGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({ description: 'Password changed successfully' })
  @ApiForbiddenResponse({ description: 'Invalid current password' })
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return await this.authService.changePassword(
      changePasswordDto?.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'User information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { $ref: '#/components/schemas/User' },
        access_token: {
          type: 'string',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhaG1lZEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwNDA1MzcsImV4cCI6MTczNzA0NDEzN30.spQheX05UdyIwAuH_yBcH1AaQTUpDOoGrtTYP7LEYsU',
        },
        refresh_token: {
          type: 'string',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhaG1lZEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwNDA1MzcsImV4cCI6MTczNzA0NDEzN30.spQheX05UdyIwAuH_yBcH1AaQTUpDOoGrtTYP7LEYsU',
        },
      },
    },
  })
  getMe(@Req() req: RequestWithUser) {
    return this.authService.getMe(+req.user['sub']);
  }

  @UseGuards(AccessTokenGuard)
  @Get('logout')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'User logged out successfully' })
  logout(@Req() req: RequestWithUser) {
    return this.authService.signOut(req.user['sub']);
  }
}
