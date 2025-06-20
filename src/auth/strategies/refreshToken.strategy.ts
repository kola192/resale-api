import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';

interface JwtPayload {
  sub: string;
  email: string;
  // Add any additional JWT claims here
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const cookies = (
            req as Request & { cookies?: Record<string, string> }
          ).cookies;
          return cookies?.refresh_token ?? null;
        },
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET ?? '', // Ensure it's a string
      passReqToCallback: true,
      ignoreExpiration: false,
    };

    super(options);
  }

  validate(
    req: Request & { cookies: Record<string, string> },
    payload: JwtPayload,
  ): JwtPayload & { refreshToken: string } {
    return {
      ...payload,
      refreshToken: req.cookies.refresh_token,
    };
  }
}
