import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { EmailOptions } from './interfaces/email-options.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly useMockEmail: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');

    // Use mock email if no API key is configured or it's a placeholder
    this.useMockEmail = !apiKey || apiKey === 'your-sendgrid-api-key';

    if (!this.useMockEmail && apiKey) {
      sgMail.setApiKey(apiKey);
      this.logger.log('SendGrid email service initialized');
    } else {
      this.logger.warn('SendGrid API key not configured. Using mock email service.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const from = options.from || this.configService.get<string>('EMAIL_FROM', 'noreply@example.com');
    const fromName = this.configService.get<string>('EMAIL_FROM_NAME', 'Laptop Checkout System');

    try {
      if (this.useMockEmail) {
        // Mock email - just log it
        this.logger.log(`[MOCK EMAIL] Sending email to: ${options.to}`);
        this.logger.log(`[MOCK EMAIL] Subject: ${options.subject}`);
        this.logger.log(`[MOCK EMAIL] Body: ${options.text || options.html?.substring(0, 100)}`);

        // Simulate async email sending
        await new Promise(resolve => setTimeout(resolve, 100));

        return true;
      }

      // Real SendGrid email
      const msg: any = {
        to: options.to,
        from: {
          email: from,
          name: fromName,
        },
        subject: options.subject,
      };

      // Add text or html content
      if (options.text) {
        msg.text = options.text;
      }
      if (options.html) {
        msg.html = options.html;
      }

      await sgMail.send(msg);
      this.logger.log(`Email sent successfully to ${options.to}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  // Template methods for different notification types
  async sendOverdueNotification(
    to: string,
    userName: string,
    laptopUniqueId: string,
    laptopMake: string,
    laptopModel: string,
    checkedOutAt: Date,
  ): Promise<boolean> {
    const daysOverdue = Math.floor(
      (Date.now() - checkedOutAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const subject = `Reminder: Overdue Laptop Check-in Required - ${laptopUniqueId}`;
    const html = `
      <h2>Laptop Check-in Reminder</h2>
      <p>Hi ${userName},</p>
      <p>This is a friendly reminder that the laptop you checked out is overdue for return.</p>

      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <strong>Laptop Details:</strong><br/>
        <ul>
          <li><strong>Unique ID:</strong> ${laptopUniqueId}</li>
          <li><strong>Make/Model:</strong> ${laptopMake} ${laptopModel}</li>
          <li><strong>Checked Out:</strong> ${checkedOutAt.toLocaleDateString()}</li>
          <li><strong>Days Overdue:</strong> ${daysOverdue}</li>
        </ul>
      </div>

      <p>Please return the laptop as soon as possible or contact the admin if you need an extension.</p>

      <p>Thank you,<br/>
      Laptop Checkout System</p>
    `;

    const text = `Hi ${userName},\n\nThis is a reminder that the laptop ${laptopUniqueId} (${laptopMake} ${laptopModel}) you checked out on ${checkedOutAt.toLocaleDateString()} is overdue for return by ${daysOverdue} days.\n\nPlease return the laptop as soon as possible.\n\nThank you,\nLaptop Checkout System`;

    return this.sendEmail({ to, subject, html, text });
  }

  async sendLostFoundNotification(
    to: string,
    userName: string,
    laptopUniqueId: string,
    isFound: boolean,
    finderName?: string,
  ): Promise<boolean> {
    if (isFound) {
      const subject = `Good News: Your Lost Laptop Has Been Found - ${laptopUniqueId}`;
      const html = `
        <h2>Your Laptop Has Been Found!</h2>
        <p>Hi ${userName},</p>
        <p>Great news! The laptop ${laptopUniqueId} you checked out has been found and returned.</p>

        ${finderName ? `<p>It was found and returned by ${finderName}. Please remember to thank them!</p>` : ''}

        <p>The laptop has been checked in and is now back in the system.</p>

        <p>Thank you,<br/>
        Laptop Checkout System</p>
      `;

      const text = `Hi ${userName},\n\nGreat news! The laptop ${laptopUniqueId} you checked out has been found and returned${finderName ? ` by ${finderName}` : ''}.\n\nThe laptop has been checked in and is now back in the system.\n\nThank you,\nLaptop Checkout System`;

      return this.sendEmail({ to, subject, html, text });
    } else {
      const subject = `Laptop Reported Lost - ${laptopUniqueId}`;
      const html = `
        <h2>Laptop Reported Lost</h2>
        <p>Dear Admin,</p>
        <p>A laptop has been reported as lost by ${userName}.</p>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>Laptop Details:</strong><br/>
          <ul>
            <li><strong>Unique ID:</strong> ${laptopUniqueId}</li>
            <li><strong>Reported By:</strong> ${userName}</li>
          </ul>
        </div>

        <p>Please follow up with the user and take appropriate action.</p>

        <p>Laptop Checkout System</p>
      `;

      const text = `Dear Admin,\n\nA laptop has been reported as lost.\n\nLaptop ID: ${laptopUniqueId}\nReported By: ${userName}\n\nPlease follow up with the user.\n\nLaptop Checkout System`;

      return this.sendEmail({ to, subject, html, text });
    }
  }

  async sendUserInvitation(
    to: string,
    userName: string,
    invitationLink: string,
  ): Promise<boolean> {
    const subject = 'Welcome to Laptop Checkout System';
    const html = `
      <h2>Welcome to Laptop Checkout System!</h2>
      <p>Hi ${userName},</p>
      <p>You've been invited to join the Laptop Checkout System.</p>

      <p>Click the link below to set up your account:</p>
      <a href="${invitationLink}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Set Up Account
      </a>

      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${invitationLink}</p>

      <p>This link will expire in 24 hours.</p>

      <p>Thank you,<br/>
      Laptop Checkout System</p>
    `;

    const text = `Hi ${userName},\n\nYou've been invited to join the Laptop Checkout System.\n\nClick this link to set up your account: ${invitationLink}\n\nThis link will expire in 24 hours.\n\nThank you,\nLaptop Checkout System`;

    return this.sendEmail({ to, subject, html, text });
  }

  async sendPasswordReset(
    to: string,
    userName: string,
    resetLink: string,
  ): Promise<boolean> {
    const subject = 'Password Reset Request - Laptop Checkout System';
    const html = `
      <h2>Password Reset Request</h2>
      <p>Hi ${userName},</p>
      <p>We received a request to reset your password for the Laptop Checkout System.</p>

      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}" style="display: inline-block; background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Reset Password
      </a>

      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${resetLink}</p>

      <p>This link will expire in 1 hour.</p>

      <p><strong>If you didn't request a password reset, please ignore this email.</strong></p>

      <p>Thank you,<br/>
      Laptop Checkout System</p>
    `;

    const text = `Hi ${userName},\n\nWe received a request to reset your password.\n\nClick this link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email.\n\nThank you,\nLaptop Checkout System`;

    return this.sendEmail({ to, subject, html, text });
  }
}
