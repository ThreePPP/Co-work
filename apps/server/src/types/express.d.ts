import { Role, UserStatus } from './enums.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  department?: string | null;
  position?: string | null;
  avatarUrl?: string | null;
  status?: UserStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
