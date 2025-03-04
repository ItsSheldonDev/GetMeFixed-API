import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../core/prisma/prisma.service';
import { RedisService } from '../core/redis/redis.service';
import { LoggerService } from '../core/logger/logger.service';
import { LoginDto, TokenResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
    private config: ConfigService,
    private logger: LoggerService,
  ) {}

  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    try {
      const { email, password } = loginDto;

      // Journalisation détaillée
      this.logger.log(`Tentative de connexion pour l'email: ${email}`);

      // Recherche de l'admin dans la base de données
      const admin = await this.prisma.admin.findUnique({
        where: { email },
      });

      if (!admin) {
        this.logger.warn(`Échec de connexion: utilisateur non trouvé - ${email}`);
        throw new UnauthorizedException('Identifiants invalides');
      }

      // Vérification du mot de passe
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        this.logger.warn(`Échec de connexion: mot de passe incorrect - ${email}`);
        throw new UnauthorizedException('Identifiants invalides');
      }

      // Création des payload pour les tokens
      const payload = {
        id: admin.id,
        email: admin.email,
      };

      // Génération des tokens
      const token = this.generateToken(payload, 'access');
      const refreshToken = this.generateToken(payload, 'refresh');

      // Essayez de stocker dans Redis, mais continuez même en cas d'échec
      try {
        await this.redis.set(
          `refresh_token:${admin.id}`,
          refreshToken,
          7 * 24 * 60 * 60, // 7 jours
        );
        this.logger.log(`Token de rafraîchissement stocké pour: ${email}`);
      } catch (redisError) {
        this.logger.error(`Erreur Redis lors du stockage du token: ${redisError.message}`, redisError.stack);
        // Continue malgré l'erreur Redis
      }

      this.logger.log(`Connexion réussie pour: ${email}`);
      return {
        token,
        refreshToken,
        user: {
          id: admin.id,
          email: admin.email,
        },
      };
    } catch (error) {
      this.logger.error(`Erreur de connexion: ${error.message}`, error.stack);
      throw error; // Relancer l'erreur pour que le filtre global puisse la traiter
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      // Vérification du refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_SECRET'),
      });
      
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Vérification du token dans Redis
      const storedToken = await this.redis.get(`refresh_token:${decoded.id}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Recherche de l'admin dans la base de données
      const admin = await this.prisma.admin.findUnique({
        where: { id: decoded.id },
      });

      if (!admin) {
        throw new UnauthorizedException('User not found');
      }

      // Génération d'un nouveau token d'accès
      const payload = {
        id: admin.id,
        email: admin.email,
      };

      const newToken = this.generateToken(payload, 'access');

      return {
        token: newToken,
      };
    } catch (error) {
      this.logger.error('Error refreshing token', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateToken(payload: any, type: 'access' | 'refresh' = 'access'): string {
    return this.jwtService.sign(
      { ...payload, type },
      {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: type === 'access' 
          ? this.config.get('JWT_EXPIRES_IN', '1h') 
          : this.config.get('REFRESH_TOKEN_EXPIRES_IN', '7d'),
      }
    );
  }
}