import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TokenPayload {
  id: string;
  email: string;
  type?: 'refresh' | 'access';
}

@Injectable()
export class JwtUtils {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  generateToken(payload: TokenPayload, type: 'access' | 'refresh' = 'access'): string {
    return this.jwtService.sign(
      { ...payload, type },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: type === 'access' 
          ? this.configService.get<string>('JWT_EXPIRES_IN', '1h')
          : this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN', '7d')
      }
    );
  }

  verifyToken(token: string): TokenPayload {
    return this.jwtService.verify(
      token,
      {
        secret: this.configService.get<string>('JWT_SECRET')
      }
    );
  }
}