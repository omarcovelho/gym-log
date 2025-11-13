import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
    constructor(private auth: AuthService) { }

    @Post('signup')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User registered successfully.' })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    signup(@Body() dto: SignupDto) {
        return this.auth.signup(dto);
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
}
