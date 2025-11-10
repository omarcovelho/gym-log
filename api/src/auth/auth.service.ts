import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) {}

    async signup(dto: SignupDto) {
        const hashed = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashed,
                name: dto.name,
            }
        });
        return this.signToken(user.id, user.email);
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) throw new Error('Invalid credentials');
        const pwMatches = await bcrypt.compare(dto.password, user.password);
        if (!pwMatches) throw new Error('Invalid credentials');
        return this.signToken(user.id, user.email);
    }


    private signToken(userId: string, email: string) {
        const payload = { sub: userId, email };
        return {
        access_token: this.jwt.sign(payload),
        };
    }
}
