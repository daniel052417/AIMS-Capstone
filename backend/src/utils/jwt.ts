import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { JWTPayload } from '../types/auth';

export class JWTUtils {
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const secret = config.JWT_SECRET || 'test-secret';
    // @ts-ignore - JWT library type issue
    return jwt.sign(payload, secret, {
      expiresIn: config.JWT_EXPIRES_IN,
      issuer: 'aims-backend',
      audience: 'aims-frontend',
    });
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const secret = config.JWT_SECRET || 'test-secret';
    // @ts-ignore - JWT library type issue
    return jwt.sign(payload, secret, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
      issuer: 'aims-backend',
      audience: 'aims-frontend',
    });
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET, {
        issuer: 'aims-backend',
        audience: 'aims-frontend',
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }

    return parts[1];
  }
}