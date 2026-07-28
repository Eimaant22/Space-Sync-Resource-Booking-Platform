import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import AppError from '../utils/AppError';
import redisClient from '../config/redis';

export interface AuthRequest extends Request {
    userId?: string;
}

export const protect = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {

    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            throw new AppError('No token provided.', 401, 'UNAUTHENTICATED');
        }

        const token = header.split(' ')[1];

        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
            throw new AppError('Invalid or expired token.', 401, 'UNAUTHENTICATED');
        }

        const decoded = verifyToken(token);
        req.userId = decoded.id;

        next();
    } catch {
        next(new AppError('Invalid or expired token.', 401, 'UNAUTHENTICATED'));
    }
};