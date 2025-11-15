import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User } from 'generated/prisma';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) { }

    async signup(dto: SignupDto) {
        const hashed = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashed,
                name: dto.name,
            }
        });
        return this.signToken(user);
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');
        const pwMatches = await bcrypt.compare(dto.password, user.password);
        if (!pwMatches) throw new UnauthorizedException('Invalid credentials');
        return this.signToken(user);
    }

    async googleLogin(profile: { providerId: string; email?: string; name?: string }) {
        if (!profile.email) {
            throw new BadRequestException('Google profile has no email')
        }

        let user = await this.prisma.user.findUnique({
            where: { email: profile.email },
        })

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: profile.email,
                    password: '', // login social, não usa senha (pode depois validar)
                    name: profile.name ?? null,
                },
            })
        }

        return await this.signToken(user)
    }


    private async signToken(user: User) {
        const payload = { sub: user.id, email: user.email };
        return {
            access_token: await this.jwt.signAsync(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        };
    }
}
