import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
export declare const getCampaigns: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getCampaignById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createCampaign: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateCampaign: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getTemplates: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAnalytics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=staff.controller.d.ts.map