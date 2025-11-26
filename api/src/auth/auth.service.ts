import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import { RequestSignupDto } from './dto/request-signup.dto';
import { ConfirmSignupDto } from './dto/confirm-signup.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User } from 'generated/prisma';
import { EmailService } from '../email/email.service';
import { AppConfigService } from '../config/config.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private emailService: EmailService,
        private configService: AppConfigService,
    ) { }

    /**
     * Detect language from Accept-Language header or default to 'pt'
     */
    private detectLanguage(acceptLanguage?: string): 'pt' | 'en' {
        if (!acceptLanguage) return 'pt';
        
        const languages = acceptLanguage
            .split(',')
            .map(lang => lang.split(';')[0].trim().toLowerCase());
        
        if (languages.some(lang => lang.startsWith('pt'))) {
            return 'pt';
        }
        
        if (languages.some(lang => lang.startsWith('en'))) {
            return 'en';
        }
        
        return 'pt';
    }

    /**
     * Get translated error message
     */
    private getErrorMessage(key: string, acceptLanguage?: string): string {
        const language = this.detectLanguage(acceptLanguage);
        
        const messages: Record<string, Record<'pt' | 'en', string>> = {
            'Email already registered': {
                pt: 'Este email já está cadastrado',
                en: 'Email already registered',
            },
            'Invalid or expired token': {
                pt: 'Token inválido ou expirado',
                en: 'Invalid or expired token',
            },
            'Token has already been used': {
                pt: 'Este token já foi utilizado',
                en: 'Token has already been used',
            },
            'Token has expired': {
                pt: 'Este token expirou',
                en: 'Token has expired',
            },
            'Failed to send confirmation email': {
                pt: 'Falha ao enviar email de confirmação',
                en: 'Failed to send confirmation email',
            },
        };
        
        return messages[key]?.[language] || key;
    }

    async signup(dto: SignupDto) {
        // Legacy signup method - kept for backward compatibility if needed
        const hashed = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashed,
                name: dto.name,
            }
        });
        
        // Enviar notificação de novo usuário (não bloquear se falhar)
        try {
            await this.emailService.sendNewUserNotification(user.email, user.name);
        } catch (error) {
            console.error('Error sending new user notification:', error);
        }
        
        return this.signToken(user);
    }

    async requestSignup(dto: RequestSignupDto, acceptLanguage?: string) {
        // Verificar se email já está cadastrado
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new BadRequestException(
                this.getErrorMessage('Email already registered', acceptLanguage)
            );
        }

        // Invalidar tokens antigos para este email
        await this.prisma.emailVerificationToken.updateMany({
            where: {
                email: dto.email,
                used: false,
            },
            data: {
                used: true,
            },
        });

        // Gerar token de verificação
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 3600000); // 24 horas

        // Salvar token no banco
        await this.prisma.emailVerificationToken.create({
            data: {
                token,
                email: dto.email,
                expiresAt,
            },
        });

        // Construir link de confirmação
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const confirmationLink = `${frontendUrl}/confirm-signup?token=${token}`;

        // Enviar email com link de confirmação
        try {
            await this.emailService.sendSignupConfirmationEmail(
                dto.email,
                confirmationLink,
                acceptLanguage
            );
            console.log(`Signup confirmation email sent to ${dto.email}`);
        } catch (error: any) {
            console.error('Error sending signup confirmation email:', error);
            
            // Se falhar ao enviar email, deletar o token criado para não deixar token órfão
            await this.prisma.emailVerificationToken.deleteMany({
                where: {
                    email: dto.email,
                    token,
                    used: false,
                },
            });
            
            // Provide more specific error message
            const errorMessage = error?.message || 'Failed to send confirmation email';
            if (errorMessage.includes('test mode') || errorMessage.includes('verify your domain')) {
                const domainError = acceptLanguage?.includes('pt') || !acceptLanguage
                    ? 'Problema de configuração do serviço de email. Entre em contato com o suporte ou verifique seu domínio de email.'
                    : 'Email service configuration issue. Please contact support or verify your email domain.';
                throw new BadRequestException(domainError);
            }
            
            throw new BadRequestException(
                this.getErrorMessage('Failed to send confirmation email', acceptLanguage)
            );
        }

        return { success: true, message: 'Confirmation email sent' };
    }

    async confirmSignup(dto: ConfirmSignupDto, acceptLanguage?: string) {
        // Validar token
        const verificationToken = await this.prisma.emailVerificationToken.findUnique({
            where: { token: dto.token },
        });

        if (!verificationToken) {
            throw new BadRequestException(
                this.getErrorMessage('Invalid or expired token', acceptLanguage)
            );
        }

        // Verificar se token já foi usado
        if (verificationToken.used) {
            throw new BadRequestException(
                this.getErrorMessage('Token has already been used', acceptLanguage)
            );
        }

        // Verificar se token expirou
        if (verificationToken.expiresAt < new Date()) {
            throw new BadRequestException(
                this.getErrorMessage('Token has expired', acceptLanguage)
            );
        }

        // Verificar se email já foi usado para criar usuário (proteção contra reuso)
        const existingUser = await this.prisma.user.findUnique({
            where: { email: verificationToken.email },
        });

        if (existingUser) {
            // Marcar token como usado mesmo que usuário já exista
            await this.prisma.emailVerificationToken.update({
                where: { id: verificationToken.id },
                data: { used: true },
            });
            throw new BadRequestException(
                this.getErrorMessage('Email already registered', acceptLanguage)
            );
        }

        // Criar usuário
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: verificationToken.email,
                password: hashedPassword,
                name: dto.name || null,
            },
        });

        // Marcar token como usado
        await this.prisma.emailVerificationToken.update({
            where: { id: verificationToken.id },
            data: { used: true },
        });

        // Enviar notificação de novo usuário (não bloquear se falhar)
        try {
            await this.emailService.sendNewUserNotification(user.email, user.name);
        } catch (error) {
            console.error('Error sending new user notification:', error);
        }

        // Retornar token JWT (login automático após confirmação)
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

        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            user = await this.prisma.user.create({
                data: {
                    email: profile.email,
                    password: '', // login social, não usa senha (pode depois validar)
                    name: profile.name ?? null,
                },
            })
            
            // Enviar notificação APENAS quando criar novo usuário (não bloquear se falhar)
            try {
                await this.emailService.sendNewUserNotification(user.email, user.name);
            } catch (error) {
                console.error('Error sending new user notification:', error);
            }
        }

        return await this.signToken(user)
    }


    async validateToken(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, role: true },
        });
        
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    async refreshToken(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        
        return this.signToken(user);
    }

    async requestPasswordReset(email: string, acceptLanguage?: string) {
        // Always return success for security (don't reveal if email exists)
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // User doesn't exist, but return success anyway
            return { success: true };
        }

        // Check if user has a password (not OAuth)
        const hasPassword = user.password && user.password.trim() !== '';

        if (!hasPassword) {
            console.log('User is OAuth, sending informative email');
            // User is OAuth, send informative email
            try {
                await this.emailService.sendOAuthAccountInfo(email, acceptLanguage);
            } catch (error) {
                console.error('Error sending informative email', error);
                throw new BadRequestException('Failed to send informative email');
            }
            return { success: true };
        }

        console.log('User has password, generating reset token');
        // User has password, generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        const expirationHours = await this.configService.getPasswordResetExpirationHours();
        const expiresAt = new Date(Date.now() + expirationHours * 3600000);

        // Save token to database
        await this.prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });

        // Build reset link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;

        // Send email
        await this.emailService.sendPasswordResetEmail(email, resetLink, acceptLanguage);

        return { success: true };
    }

    async resetPassword(token: string, newPassword: string) {
        // Find token in database
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            throw new BadRequestException('Invalid or expired token');
        }

        // Check if token is already used
        if (resetToken.used) {
            throw new BadRequestException('Token has already been used');
        }

        // Check if token is expired
        if (resetToken.expiresAt < new Date()) {
            throw new BadRequestException('Token has expired');
        }

        // Check if user has a password (should not allow reset for OAuth without password)
        if (!resetToken.user.password || resetToken.user.password.trim() === '') {
            throw new BadRequestException('This account uses OAuth and cannot reset password');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await this.prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword },
        });

        // Mark token as used
        await this.prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { used: true },
        });

        return { success: true };
    }

    private async signToken(user: User) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: await this.jwt.signAsync(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            }
        };
    }
}
