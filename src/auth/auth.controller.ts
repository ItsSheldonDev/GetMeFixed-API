import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, TokenResponseDto } from './dto/auth.dto';
import { Public } from '../core/decorators/public.decorator';
import { RateLimiterGuard } from '../core/guards/rate-limiter.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  @UseGuards(RateLimiterGuard)
  @ApiOperation({ summary: 'Login to get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    try {
      console.log('Tentative de connexion:', loginDto.email);
      return await this.authService.login(loginDto);
    } catch (error) {
      console.error('Erreur dans login controller:', error);
      throw error; // Relancer pour que le filtre global puisse le traiter
    }
  }

  @Post('refresh-token')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    try {
      return await this.authService.refreshToken(refreshTokenDto.refreshToken);
    } catch (error) {
      console.error('Erreur dans refresh token controller:', error);
      throw error;
    }
  }
}