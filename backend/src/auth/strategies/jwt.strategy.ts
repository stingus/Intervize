import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { ErrorCode } from '../../common/enums/error-codes.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret-key',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        groupName: true,
        team: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_USER_NOT_FOUND,
        message: 'User not found or has been deleted',
      });
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  }
}
