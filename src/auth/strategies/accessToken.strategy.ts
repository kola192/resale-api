import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
  // Add additional claims if needed
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? '', // ensure it's always a string
    };

    super(options);
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
