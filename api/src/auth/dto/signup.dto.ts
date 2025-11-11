import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ example: 'password123', minLength: 6 })
  password: string;

  @IsString()
  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;
}
