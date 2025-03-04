import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@getmefixed.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  refreshToken: string;
}

export class TokenResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty({ required: false })
  refreshToken?: string;

  @ApiProperty({ required: false })
  user?: {
    id: string;
    email: string;
  };
}

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;
}