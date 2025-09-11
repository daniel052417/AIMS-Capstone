import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getPurchaseOrders: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPurchaseOrderById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createPurchaseOrder: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updatePurchaseOrder: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const approvePurchaseOrder: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updatePurchaseOrderItem: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const receivePurchaseOrderItem: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSuppliers: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSupplierById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createSupplier: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateSupplier: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPurchaseReport: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSupplierPerformance: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPurchasesDashboard: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=purchases.controller.d.ts.map