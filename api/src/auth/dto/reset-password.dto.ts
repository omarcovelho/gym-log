import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @IsString()
  @ApiProperty({ example: 'abc123def456...' })
  token: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ example: 'newSecurePassword123', minLength: 6 })
  newPassword: string;
}

