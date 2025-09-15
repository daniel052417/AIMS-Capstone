import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { validateRequest } from '../utils/validation';
import { authValidation } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.refreshToken(req.body.refresh_token);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await AuthService.logout(userId);
    
    res.status(200).json(result);
  });
}