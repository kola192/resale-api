import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Res,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { setRefreshTokenCookie } from 'src/common/helpers/responses/refreshTokenCookie';
import { PrismaService } from 'src/prisma/prisma.service';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Response } from 'express';
import { users } from '@prisma/client';
import { HashUtils } from '../utils/hashUtils';
import { ErrorHandlingService } from 'src/shared/error-handling.service';
import { SignInDto } from './dto/sign-in.dto';
import { CreateAuthDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly i18n: I18nService,
    private errorHandlingService: ErrorHandlingService,
    private readonly hashUtils: HashUtils,
  ) {}

  async signUp(
    createUserDto: CreateAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    data: users;
    access_token: string;
    refresh_token: string;
    message: string;
  }> {
    try {
      const isUserExist = await this.prisma.users.findUnique({
        where: { email: createUserDto.email },
      });

      if (isUserExist) {
        throw new NotFoundException(
          this.i18n.t('validation.users.user_exist', {
            lang: I18nContext?.current()?.lang,
          }),
        );
      }

      const hash = await this.hashUtils.hashData(createUserDto.password);

      const agentType = await this.prisma.agents_types.findFirst({
        where: { code: createUserDto.agent_type_code },
      });

      if (!agentType?.id) {
        throw new NotFoundException(
          this.i18n.t('validation.agent_type.not_found', {
            lang: I18nContext?.current()?.lang,
          }),
        );
      }

      const userRole = await this.prisma.roles.findFirst({
        where: { code: createUserDto.agent_type_code },
      });

      if (!userRole?.id) {
        throw new NotFoundException(
          this.i18n.t('validation.user_role.not_found', {
            lang: I18nContext?.current()?.lang,
          }),
        );
      }
      // Validate main_user_id logic
      const isMainUser = createUserDto.agent_users?.main_user_id === null;

      if (!isMainUser && !createUserDto.agent_users?.main_user_id) {
        throw new BadRequestException(
          this.i18n.t('validation.main_user_id.number', {
            lang: I18nContext?.current()?.lang,
          }),
        );
      }

      // Run transaction and get the user
      const user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.users.create({
          data: {
            email: createUserDto.email,
            name: createUserDto.name,
            password: hash,
            phone: createUserDto.phone,
          },
          include: {
            user_roles: {
              include: {
                roles: {
                  include: {
                    role_permissions: {
                      include: {
                        permissions: {
                          select: {
                            code: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        const agent = await tx.agents.create({
          data: {
            name: createUserDto.name,
            agent_type_id: agentType.id,
          },
        });

        await tx.agent_users.create({
          data: {
            user_id: createdUser.id,
            agent_id: agent.id,
            main_user_id: createUserDto.agent_users?.main_user_id || null,
          },
        });

        await tx.user_roles.create({
          data: { user_id: createdUser?.id, role_id: userRole?.id },
        });

        await tx.inventories.create({
          data: {
            agent_id: agent.id,
          },
        });

        // return createdUser;
        const completeUser = await tx.users.findUnique({
          where: { id: createdUser.id },
          include: {
            user_roles: {
              include: {
                roles: {
                  include: {
                    role_permissions: {
                      include: {
                        permissions: {
                          select: {
                            code: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!completeUser) {
          throw new NotFoundException(
            this.i18n.t('validation.users.user_not_found', {
              lang: I18nContext?.current()?.lang,
            }),
          );
        }
        return completeUser;
      });

      // Generate tokens
      const tokens = await this.getTokens(`${user.id}`, user.email);
      await this.updateRefreshToken(`${user.id}`, tokens.refresh_token);
      setRefreshTokenCookie(tokens.refresh_token, res);

      return {
        data: user,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        message: this.i18n.t('users.signup.success', {
          lang: I18nContext?.current()?.lang,
        }),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async signIn(
    data: SignInDto,
    res: Response,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    data: users;
    message: Array<string>;
  }> {
    try {
      // Check if user exists
      const user = await this.prisma.users.findUnique({
        where: {
          email: data?.email,
        },
        include: {
          user_roles: {
            include: {
              roles: {
                include: {
                  role_permissions: {
                    include: {
                      permissions: {
                        select: {
                          code: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!user)
        throw new NotFoundException(
          this.i18n.t('validation.users.user_not_found', {
            lang: I18nContext?.current()?.lang,
          }),
        );

      const passwordMatches = await argon2.verify(
        user?.password,
        data.password,
      );
      if (!passwordMatches)
        throw new BadRequestException(
          this.i18n.t('validation.users.invalid_login', {
            lang: I18nContext?.current()?.lang,
          }),
        );
      const tokens = await this.getTokens(`${user?.id}`, user?.email);
      await this.updateRefreshToken(`${user?.id}`, tokens?.refresh_token);
      setRefreshTokenCookie(tokens?.refresh_token, res as any);
      return {
        data: { ...user, password: '' },
        ...tokens,
        message: this.i18n.t('users.signin.success', {
          lang: I18nContext?.current()?.lang,
        }),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async getMe(id: number): Promise<{ data: users }> {
    try {
      const user = await this.prisma.users.findFirst({
        where: { id },
        include: {
          user_roles: {
            include: {
              roles: {
                include: {
                  role_permissions: {
                    include: {
                      permissions: {
                        select: {
                          code: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        data: {
          ...user,
          password: '', // remove password
        },
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async signOut(userId: string): Promise<object> {
    try {
      await this.prisma.users.update({
        where: {
          id: +userId,
        },
        data: { refresh_token: null },
      });
      return {
        message: this.i18n.t('users.signout.success', {
          lang: I18nContext?.current()?.lang,
        }),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      // Find user by ID
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(
          this.i18n.t('validation.users.user_not_found', {
            lang: I18nContext?.current()?.lang,
          }),
        );
      }

      // Verify current password
      const passwordMatches = await argon2.verify(
        user.password,
        currentPassword,
      );
      if (!passwordMatches) {
        throw new BadRequestException(
          this.i18n.t('validation.users.invalid_current_password', {
            lang: I18nContext?.current()?.lang,
          }),
        );
      }

      // Hash new password
      const hashedNewPassword = await this.hashUtils.hashData(newPassword);

      // Update user with new password
      await this.prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          password: hashedNewPassword,
        },
      });

      // Success message (optional)
      return {
        message: this.i18n.t('users.password_changed', {
          lang: I18nContext?.current()?.lang,
        }),
      };
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async updateRefreshToken(userId: string, refresh_token: string) {
    const hashedRefreshToken = await this.hashUtils.hashData(refresh_token);

    await this.prisma.users.update({
      where: {
        id: +userId,
      },
      data: {
        refresh_token: hashedRefreshToken,
      },
    });
  }

  async refreshTokens(userId: number, refresh_token: string, res: Response) {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user || !user?.refresh_token) throw new ForbiddenException();

      const refreshTokenMatches = await argon2.verify(
        user?.refresh_token,
        refresh_token,
      );
      if (!refreshTokenMatches) throw new ForbiddenException();
      const tokens = await this.getTokens(`${user.id}`, user?.email);
      await this.updateRefreshToken(`${user.id}`, tokens?.refresh_token);
      setRefreshTokenCookie(tokens?.refresh_token, res as any);
      return tokens;
    } catch (error) {
      this.errorHandlingService.handlePrismaAndHttpExceptions(error);
    }
  }

  async getTokens(userId: string, email: string) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '60m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }
}
