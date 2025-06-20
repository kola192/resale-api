import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    sub: string;
    // Add other user properties here (e.g., email, roles)
    email: string;
    roles?: string[];
  };
}
