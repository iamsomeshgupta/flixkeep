const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify transporter connection
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error(`SMTP Connection error: ${error.message}`);
      } else {
        logger.info('SMTP Server is ready to take messages');
      }
    });
  }

  async sendEmail({ to, subject, html }) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'FlixKeep <noreply@flixkeep.com>',
      to,
      subject,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Error sending email: ${error.message}`);
      throw new Error(`Failed to send email. please try again later.`);
    }
  }

  async sendVerificationEmail(email, username, token) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    
    const html = `
      <div style="font-family: 'Inter', sans-serif; background-color: #0b0d19; color: #f1f5f9; padding: 2rem; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.08)">
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1 style="color: #E50914; font-family: 'Outfit', sans-serif; margin-bottom: 0.5rem; font-weight: 800; font-size: 2.5rem;">FlixKeep</h1>
          <p style="color: #94a3b8; font-size: 1.1rem; margin-top: 0;">Your Ultimate Watchlist & Social Hub</p>
        </div>
        <div style="background: rgba(18, 22, 33, 0.45); padding: 2rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05)">
          <h2 style="font-family: 'Outfit', sans-serif; color: #f1f5f9; margin-top: 0;">Welcome, ${username}!</h2>
          <p style="color: #94a3b8; line-height: 1.6;">Thank you for registering on FlixKeep. To complete your registration and unlock all collaborative watchlist and social features, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${verificationUrl}" style="background-color: #E50914; color: white; padding: 0.8rem 2rem; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 4px 14px rgba(229, 9, 20, 0.4);">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 0.85rem; text-align: center;">Or copy and paste this link in your browser:<br/>
            <a href="${verificationUrl}" style="color: #6366f1; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>
        <div style="text-align: center; margin-top: 2rem; color: #64748b; font-size: 0.8rem;">
          <p style="margin-bottom: 0.25rem;">&copy; ${new Date().getFullYear()} FlixKeep. All rights reserved.</p>
          <p style="margin-top: 0;">Engineered for movie enthusiasts.</p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Verify your FlixKeep Account',
      html,
    });
  }

  async sendPasswordResetEmail(email, username, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    
    const html = `
      <div style="font-family: 'Inter', sans-serif; background-color: #0b0d19; color: #f1f5f9; padding: 2rem; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.08)">
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1 style="color: #E50914; font-family: 'Outfit', sans-serif; margin-bottom: 0.5rem; font-weight: 800; font-size: 2.5rem;">FlixKeep</h1>
          <p style="color: #94a3b8; font-size: 1.1rem; margin-top: 0;">Reset Password Request</p>
        </div>
        <div style="background: rgba(18, 22, 33, 0.45); padding: 2rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05)">
          <h2 style="font-family: 'Outfit', sans-serif; color: #f1f5f9; margin-top: 0;">Hi ${username},</h2>
          <p style="color: #94a3b8; line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new password. This reset link is only active for 10 minutes.</p>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${resetUrl}" style="background-color: #E50914; color: white; padding: 0.8rem 2rem; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 4px 14px rgba(229, 9, 20, 0.4);">
              Reset Password
            </a>
          </div>
          
          <p style="color: #94a3b8; line-height: 1.6;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
          
          <p style="color: #64748b; font-size: 0.85rem; text-align: center;">Or copy and paste this link in your browser:<br/>
            <a href="${resetUrl}" style="color: #6366f1; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        <div style="text-align: center; margin-top: 2rem; color: #64748b; font-size: 0.8rem;">
          <p style="margin-bottom: 0.25rem;">&copy; ${new Date().getFullYear()} FlixKeep. All rights reserved.</p>
          <p style="margin-top: 0;">Engineered for movie enthusiasts.</p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'FlixKeep - Password Reset Request',
      html,
    });
  }
}

module.exports = new EmailService();
