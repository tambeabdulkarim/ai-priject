import { Request } from 'express';
import { JwtPayload } from './jwt-payload.interface';

export interface AuthenticatedRequest extends Request {
  // Populated whenever a valid access token was presented — always on
  // protected routes (JwtAuthGuard rejects otherwise), optionally on
  // @Public() routes that accept but don't require authentication.
  user?: JwtPayload;
}
