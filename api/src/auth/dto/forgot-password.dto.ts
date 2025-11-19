import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @IsEmail()
  @IsString()
  @ApiProperty({ example: 'user@example.com' })
  email: string;
}

