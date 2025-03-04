import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    // Vérifie si c'est un token de rafraîchissement
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Recherche l'administrateur dans la base de données
    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.id },
    });

    if (!admin) {
      throw new UnauthorizedException('User not found');
    }

    // Retourne l'objet utilisateur sans le mot de passe
    const { password, ...result } = admin;
    return result;
  }
}