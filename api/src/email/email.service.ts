import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }
    this.resend = new Resend(apiKey);
    this.fromEmail = process.env.EMAIL_FROM || 'GymLog <onboarding@resend.dev>';
  }

  /**
   * Detect language from Accept-Language header or default to 'pt'
   */
  private detectLanguage(acceptLanguage?: string): 'pt' | 'en' {
    if (!acceptLanguage) return 'pt';
    
    // Parse Accept-Language header (e.g., 'pt-BR,pt;q=0.9,en;q=0.8')
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase());
    
    // Check if Portuguese is preferred
    if (languages.some(lang => lang.startsWith('pt'))) {
      return 'pt';
    }
    
    // Check if English is preferred
    if (languages.some(lang => lang.startsWith('en'))) {
      return 'en';
    }
    
    return 'pt'; // Default to Portuguese
  }

  /**
   * Load HTML template from file
   */
  private loadTemplate(templateName: string, language: 'pt' | 'en'): string {
    // Try dist path first (production/compiled)
    // In dist, templates are at dist/email/templates/
    let templatePath = path.join(
      __dirname,
      'templates',
      `${templateName}.${language}.html`
    );
    
    // If not found, try alternative dist path (dist/email/templates/)
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(
        __dirname,
        '..',
        '..',
        'email',
        'templates',
        `${templateName}.${language}.html`
      );
    }
    
    // If not found in dist, try src path (development)
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(
        __dirname,
        '..',
        '..',
        'src',
        'email',
        'templates',
        `${templateName}.${language}.html`
      );
    }
    
    try {
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file does not exist: ${templatePath}`);
      }
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.error(`Failed to load template: ${templateName}.${language}.html`);
      console.error(`Tried paths:`, [
        path.join(__dirname, 'templates', `${templateName}.${language}.html`),
        path.join(__dirname, '..', '..', 'email', 'templates', `${templateName}.${language}.html`),
        path.join(__dirname, '..', '..', 'src', 'email', 'templates', `${templateName}.${language}.html`),
      ]);
      throw new Error(`Template not found: ${templateName}.${language}.html. Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Replace placeholders in template
   */
  private replacePlaceholders(template: string, replacements: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
    acceptLanguage?: string
  ): Promise<void> {
    const language = this.detectLanguage(acceptLanguage);
    const template = this.loadTemplate('password-reset', language);
    
    const html = this.replacePlaceholders(template, {
      resetLink,
      appName: 'GymLog',
    });

    await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: language === 'pt' 
        ? 'Recuperação de Senha - GymLog'
        : 'Password Recovery - GymLog',
      html,
    });
  }

  /**
   * Send OAuth account info email
   */
  async sendOAuthAccountInfo(
    email: string,
    acceptLanguage?: string
  ): Promise<void> {
    const language = this.detectLanguage(acceptLanguage);
    const template = this.loadTemplate('oauth-info', language);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const loginUrl = `${frontendUrl}/login`;
    
    const html = this.replacePlaceholders(template, {
      loginUrl,
      appName: 'GymLog',
    });

    await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: language === 'pt'
        ? 'Informações da sua conta - GymLog'
        : 'Your Account Information - GymLog',
      html,
    });
  }

  /**
   * Send new user notification email to admin
   */
  async sendNewUserNotification(
    userEmail: string,
    userName?: string | null
  ): Promise<void> {
    // Verificar se a variável de ambiente está definida
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) {
      // Se não estiver definida, retornar silenciosamente (fail-safe)
      return;
    }

    try {
      // Usar português como padrão para notificações administrativas
      const template = this.loadTemplate('new-user-notification', 'pt');
      
      const registrationDate = new Date().toLocaleString('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short',
      });
      
      const html = this.replacePlaceholders(template, {
        appName: 'GymLog',
        userEmail,
        userName: userName || 'Não informado',
        registrationDate,
      });

      await this.resend.emails.send({
        from: this.fromEmail,
        to: adminEmail,
        subject: 'Novo Usuário Registrado - GymLog',
        html,
      });
    } catch (error) {
      // Log do erro mas não propagar para não quebrar o fluxo de registro
      console.error('Error sending new user notification email:', error);
    }
  }

  /**
   * Send signup confirmation email with link
   */
  async sendSignupConfirmationEmail(
    email: string,
    confirmationLink: string,
    acceptLanguage?: string
  ): Promise<void> {
    try {
      const language = this.detectLanguage(acceptLanguage);
      const template = this.loadTemplate('signup-confirmation', language);
      
      const html = this.replacePlaceholders(template, {
        confirmationLink,
        appName: 'GymLog',
      });

      console.log(`Attempting to send signup confirmation email to ${email}`);
      console.log(`From: ${this.fromEmail}`);
      console.log(`Confirmation link: ${confirmationLink}`);

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: language === 'pt'
          ? 'Confirme seu cadastro - GymLog'
          : 'Confirm your registration - GymLog',
        html,
      });

      console.log('Email sent successfully:', result);
    } catch (error: any) {
      console.error('Error in sendSignupConfirmationEmail:', error);
      
      // Check if it's a Resend validation error (test mode restriction)
      if (error?.statusCode === 403 && error?.name === 'validation_error') {
        const errorMessage = error?.message || '';
        if (errorMessage.includes('You can only send testing emails to your own email')) {
          console.error('Resend is in test mode. Only emails to the account owner are allowed.');
          console.error('To send to other recipients, verify a domain at resend.com/domains');
          throw new Error(
            'Email service is in test mode. Please verify your domain at resend.com/domains to send emails to other recipients.'
          );
        }
      }
      
      // Log full error details for debugging
      if (error?.response) {
        console.error('Resend API error response:', JSON.stringify(error.response, null, 2));
      } else {
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
      
      throw error; // Re-throw to let caller handle it
    }
  }
}


