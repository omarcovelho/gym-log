import { Body, Controller, Get, Post, Req, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SignupDto } from './dto/signup.dto';
import { RequestSignupDto } from './dto/request-signup.dto';
import { ConfirmSignupDto } from './dto/confirm-signup.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from 'src/common/decorators/current-user';
import { JwtAuthGuard } from './jwt/jwt.guard';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
    constructor(private auth: AuthService) { }

    @Post('signup')
    @ApiOperation({ summary: 'Request signup - sends confirmation email' })
    @ApiResponse({ status: 200, description: 'Confirmation email sent successfully.' })
    @ApiResponse({ status: 400, description: 'Bad request (e.g., email already registered).' })
    async requestSignup(
        @Body() dto: RequestSignupDto,
        @Headers('accept-language') acceptLanguage?: string
    ) {
        return this.auth.requestSignup(dto, acceptLanguage);
    }

    @Post('confirm-signup')
    @ApiOperation({ summary: 'Confirm signup and set password' })
    @ApiResponse({ status: 200, description: 'User registered and logged in successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
    async confirmSignup(
        @Body() dto: ConfirmSignupDto,
        @Headers('accept-language') acceptLanguage?: string
    ) {
        return this.auth.confirmSignup(dto, acceptLanguage);
    }

    @Get('google')
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    @ApiResponse({ status: 302, description: 'Redirects to Google OAuth.' })
    @UseGuards(AuthGuard('google'))
    async googleAuth() {
    }

    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    login(@Body() dto: LoginDto) {
        return this.auth.login(dto);
    }
    
    @Get('google/callback')
    @ApiOperation({ summary: 'Google OAuth callback' })
    @ApiResponse({ status: 200, description: 'OAuth callback processed.' })
    @UseGuards(AuthGuard('google'))
    async googleCallback(@Req() req) {
        const { access_token, user } = await this.auth.googleLogin(req.user);

        const frontendUrl = process.env.FRONTEND_URL!;

        // Responde uma pagininha que manda o token de volta pro opener e fecha o popup
        return `
      <!DOCTYPE html>
      <html>
        <body>
          <script>
            (function() {
              var payload = ${JSON.stringify({
            token: access_token,
            email: user.email,
            name: user.name,
        })};

              // Envia mensagem pra janela que abriu o popup
              if (window.opener) {
                window.opener.postMessage(
                  payload,
                  '${frontendUrl}'
                );
              }
              window.close();
            })();
          </script>
        </body>
      </html>
    `;
    }

    @Get('validate')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Validate current token and get user info' })
    @ApiResponse({ status: 200, description: 'Token is valid.' })
    @ApiResponse({ status: 401, description: 'Token is invalid or expired.' })
    async validate(@CurrentUser() user) {
        return this.auth.validateToken(user.id);
    }

    @Post('refresh')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
    @ApiResponse({ status: 401, description: 'Token is invalid or expired.' })
    async refresh(@CurrentUser() user) {
        return this.auth.refreshToken(user.id);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset' })
    @ApiResponse({ status: 200, description: 'If the email exists, a reset link will be sent.' })
    async forgotPassword(
        @Body() dto: ForgotPasswordDto,
        @Headers('accept-language') acceptLanguage?: string
    ) {
        return this.auth.requestPasswordReset(dto.email, acceptLanguage);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password with token' })
    @ApiResponse({ status: 200, description: 'Password reset successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.auth.resetPassword(dto.token, dto.newPassword);
    }
}
