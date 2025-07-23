import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@shared/types';
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireLeaderOrAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireMemberOrAbove: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map