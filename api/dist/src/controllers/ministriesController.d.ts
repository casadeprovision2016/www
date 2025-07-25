import { Response } from 'express';
import { AuthenticatedRequest } from '@shared/types';
export declare const getMinistries: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMinistryById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const createMinistry: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateMinistry: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteMinistry: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getMinistryMembers: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const addMinistryMember: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const removeMinistryMember: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateMinistryMember: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=ministriesController.d.ts.map