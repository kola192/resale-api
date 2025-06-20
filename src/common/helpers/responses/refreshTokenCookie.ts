import { Response } from 'express';

export const setRefreshTokenCookie = (refresh_token: string, res: Response) => {
  res.cookie('refresh_token', refresh_token, {
    httpOnly: true, // Only accessible by the server
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    sameSite: 'strict', // CSRF protection
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
};
