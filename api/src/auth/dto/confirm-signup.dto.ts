import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class ConfirmSignupDto {
  @ApiProperty({ example: 'abc123def456...' })
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ example: 'password123', minLength: 6 })
  password: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;
}

