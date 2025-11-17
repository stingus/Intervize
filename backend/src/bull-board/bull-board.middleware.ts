import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../config/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BullBoardAuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No token provided');
      }

      const token = authHeader.substring(7);

      // Verify token
      const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default-secret-key';
      const payload = this.jwtService.verify(token, { secret: jwtSecret });

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, deletedAt: null },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        throw new UnauthorizedException('Admin access required');
      }

      // Attach user to request for logging
      (req as any).user = user;

      next();
    } catch (error) {
      res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized access to Bull Board',
        error: 'Unauthorized',
      });
    }
  }
}
