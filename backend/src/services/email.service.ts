import nodemailer from 'nodemailer';
import { config } from '../config/env';

export interface WelcomeEmailData {
  to: string;
  name: string;
  employeeId: string;
  password: string;
  position: string;
  department: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

  static async sendWelcomeEmail(data: WelcomeEmailData) {
    try {
      const mailOptions = {
        from: config.SMTP_FROM,
        to: data.to,
        subject: 'Welcome to Agrivet - Your Account Details',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5aa0;">Welcome to Agrivet, ${data.name}!</h2>
            
            <p>Your staff account has been successfully created. Here are your login details:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c5aa0; margin-top: 0;">Account Information</h3>
              <p><strong>Employee ID:</strong> ${data.employeeId}</p>
              <p><strong>Email:</strong> ${data.to}</p>
              <p><strong>Temporary Password:</strong> ${data.password}</p>
              <p><strong>Position:</strong> ${data.position}</p>
              <p><strong>Department:</strong> ${data.department}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #856404; margin-top: 0;">Important Security Notice</h4>
              <p>For security reasons, please change your password immediately after your first login.</p>
            </div>
            
            <p>You can now log in to the system using your email and the temporary password provided above.</p>
            
            <p>If you have any questions or need assistance, please contact the HR department.</p>
            
            <p>Best regards,<br>Agrivet HR Team</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send welcome email');
    }
  }
}