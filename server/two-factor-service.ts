import { db } from './db';
import { 
  twoFactorAuth, 
  twoFactorSessions,
  type TwoFactorAuth,
  type InsertTwoFactorAuth,
  type TwoFactorSession
} from '@shared/workflow-schema';
import { eq, and, gte } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import * as crypto from 'crypto';
import { wsManager } from './websocket';

interface SetupTwoFactorRequest {
  userId: string;
  method: 'totp' | 'sms' | 'email';
  phoneNumber?: string;
}

interface VerifyTwoFactorRequest {
  userId: string;
  code: string;
  sessionId?: string;
}

interface SendCodeRequest {
  userId: string;
  method: 'sms' | 'email';
  action: string;
}

class TwoFactorService {
  // Generate secret for TOTP
  private generateSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  // Generate backup codes
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  // Generate 6-digit code
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Setup two-factor authentication
  async setupTwoFactor(request: SetupTwoFactorRequest): Promise<TwoFactorAuth> {
    try {
      // Check if 2FA already exists for user
      const [existing] = await db
        .select()
        .from(twoFactorAuth)
        .where(eq(twoFactorAuth.userId, request.userId))
        .limit(1);

      if (existing) {
        // Update existing 2FA settings
        const methods = (existing.methods as string[]) || [];
        if (!methods.includes(request.method)) {
          methods.push(request.method);
        }

        const updated = await db
          .update(twoFactorAuth)
          .set({
            methods,
            phoneNumber: request.phoneNumber || existing.phoneNumber,
            updatedAt: new Date()
          })
          .where(eq(twoFactorAuth.userId, request.userId))
          .returning();

        return updated[0];
      }

      // Create new 2FA setup
      const secret = this.generateSecret();
      const backupCodes = this.generateBackupCodes();
      
      const twoFactorData: InsertTwoFactorAuth = {
        id: nanoid(),
        userId: request.userId,
        secret,
        isEnabled: false, // Requires verification to enable
        backupCodes,
        methods: [request.method],
        primaryMethod: request.method,
        phoneNumber: request.phoneNumber
      };

      const [created] = await db
        .insert(twoFactorAuth)
        .values(twoFactorData)
        .returning();

      // Generate QR code URL for TOTP
      if (request.method === 'totp') {
        const otpAuthUrl = this.generateOtpAuthUrl(request.userId, secret);
        return { ...created, qrCodeUrl: otpAuthUrl } as any;
      }

      return created;
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      throw error;
    }
  }

  // Generate OTP auth URL for QR code
  private generateOtpAuthUrl(userId: string, secret: string): string {
    const issuer = 'GOFAP';
    const algorithm = 'SHA1';
    const digits = 6;
    const period = 30;

    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm,
      digits: digits.toString(),
      period: period.toString()
    });

    return `otpauth://totp/${issuer}:${userId}?${params.toString()}`;
  }

  // Send verification code
  async sendVerificationCode(request: SendCodeRequest): Promise<TwoFactorSession> {
    try {
      // Get user's 2FA settings
      const [auth] = await db
        .select()
        .from(twoFactorAuth)
        .where(eq(twoFactorAuth.userId, request.userId))
        .limit(1);

      if (!auth) {
        throw new Error('Two-factor authentication not set up for user');
      }

      // Generate code and session
      const code = this.generateCode();
      const sessionData = {
        id: nanoid(),
        userId: request.userId,
        challengeCode: this.hashCode(code),
        method: request.method,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
        maxAttempts: 3,
        isVerified: false
      };

      const [session] = await db
        .insert(twoFactorSessions)
        .values(sessionData)
        .returning();

      // Send code based on method
      if (request.method === 'sms' && auth.phoneNumber) {
        await this.sendSMS(auth.phoneNumber, `Your GOFAP verification code is: ${code}`);
      } else if (request.method === 'email') {
        await this.sendEmail(request.userId, `Your GOFAP verification code is: ${code}`);
      }

      // Send WebSocket notification
      wsManager.sendToUser(request.userId, {
        type: 'notification',
        data: {
          title: '2FA Code Sent',
          message: `Verification code sent via ${request.method}`,
          sessionId: session.id
        },
        userId: request.userId,
        timestamp: Date.now()
      });

      return session;
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  }

  // Verify two-factor code
  async verifyCode(request: VerifyTwoFactorRequest): Promise<boolean> {
    try {
      // Get user's 2FA settings
      const [auth] = await db
        .select()
        .from(twoFactorAuth)
        .where(eq(twoFactorAuth.userId, request.userId))
        .limit(1);

      if (!auth || !auth.isEnabled) {
        throw new Error('Two-factor authentication not enabled for user');
      }

      // Check if it's a backup code
      const backupCodes = (auth.backupCodes as string[]) || [];
      if (backupCodes.includes(request.code)) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter(c => c !== request.code);
        await db
          .update(twoFactorAuth)
          .set({
            backupCodes: updatedCodes,
            lastUsedAt: new Date()
          })
          .where(eq(twoFactorAuth.userId, request.userId));

        return true;
      }

      // For TOTP, verify using the secret
      if (!request.sessionId) {
        // TOTP verification
        const isValid = this.verifyTOTP(request.code, auth.secret);
        
        if (isValid) {
          await db
            .update(twoFactorAuth)
            .set({ lastUsedAt: new Date() })
            .where(eq(twoFactorAuth.userId, request.userId));
        }
        
        return isValid;
      }

      // For SMS/Email, verify using session
      const [session] = await db
        .select()
        .from(twoFactorSessions)
        .where(
          and(
            eq(twoFactorSessions.id, request.sessionId),
            eq(twoFactorSessions.userId, request.userId),
            eq(twoFactorSessions.isVerified, false),
            gte(twoFactorSessions.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!session) {
        throw new Error('Invalid or expired verification session');
      }

      // Check attempts
      if ((session.attempts || 0) >= (session.maxAttempts || 3)) {
        throw new Error('Maximum verification attempts exceeded');
      }

      // Verify code
      const codeHash = this.hashCode(request.code);
      const isValid = codeHash === session.challengeCode;

      if (isValid) {
        // Mark session as verified
        await db
          .update(twoFactorSessions)
          .set({
            isVerified: true,
            verifiedAt: new Date()
          })
          .where(eq(twoFactorSessions.id, session.id));

        // Update last used
        await db
          .update(twoFactorAuth)
          .set({ lastUsedAt: new Date() })
          .where(eq(twoFactorAuth.userId, request.userId));
      } else {
        // Increment attempts
        await db
          .update(twoFactorSessions)
          .set({ attempts: (session.attempts || 0) + 1 })
          .where(eq(twoFactorSessions.id, session.id));
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      throw error;
    }
  }

  // Enable/disable 2FA
  async toggleTwoFactor(userId: string, enable: boolean): Promise<TwoFactorAuth> {
    const [updated] = await db
      .update(twoFactorAuth)
      .set({
        isEnabled: enable,
        updatedAt: new Date()
      })
      .where(eq(twoFactorAuth.userId, userId))
      .returning();

    // Send notification
    wsManager.sendToUser(userId, {
      type: 'notification',
      data: {
        title: '2FA Status Changed',
        message: `Two-factor authentication has been ${enable ? 'enabled' : 'disabled'}`,
        severity: enable ? 'success' : 'warning'
      },
      userId,
      timestamp: Date.now()
    });

    return updated;
  }

  // Check if 2FA is required for action
  async requiresTwoFactor(userId: string, action: string, amount?: number): Promise<boolean> {
    try {
      // Get user's 2FA settings
      const [auth] = await db
        .select()
        .from(twoFactorAuth)
        .where(eq(twoFactorAuth.userId, userId))
        .limit(1);

      if (!auth || !auth.isEnabled) {
        return false;
      }

      // Check if action requires 2FA based on amount threshold
      // This would typically check workflow rules
      if (amount && amount > 10000) {
        return true;
      }

      // High-risk actions always require 2FA
      const highRiskActions = [
        'delete_account',
        'change_password',
        'add_bank_account',
        'large_payment',
        'bulk_operation'
      ];

      return highRiskActions.includes(action);
    } catch (error) {
      console.error('Error checking 2FA requirement:', error);
      return false;
    }
  }

  // Hash code for storage
  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  // Verify TOTP code
  private verifyTOTP(code: string, secret: string): boolean {
    // Simple TOTP verification (in production, use a proper TOTP library)
    const counter = Math.floor(Date.now() / 1000 / 30);
    
    // Check current and adjacent time windows
    for (let i = -1; i <= 1; i++) {
      const testCounter = counter + i;
      const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
      hmac.update(Buffer.from(testCounter.toString(16).padStart(16, '0'), 'hex'));
      const hash = hmac.digest();
      
      const offset = hash[hash.length - 1] & 0xf;
      const binary = 
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);
      
      const otp = (binary % 1000000).toString().padStart(6, '0');
      
      if (otp === code) {
        return true;
      }
    }
    
    return false;
  }

  // Mock SMS sending (in production, use Twilio or similar)
  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    console.log(`Sending SMS to ${phoneNumber}: ${message}`);
    // In production, integrate with SMS provider
  }

  // Mock email sending (in production, use SendGrid or similar)
  private async sendEmail(userId: string, message: string): Promise<void> {
    console.log(`Sending email to user ${userId}: ${message}`);
    // In production, integrate with email provider
  }

  // Clean up expired sessions
  async cleanupSessions(): Promise<void> {
    try {
      await db
        .delete(twoFactorSessions)
        .where(
          and(
            eq(twoFactorSessions.isVerified, false),
            gte(twoFactorSessions.expiresAt, new Date())
          )
        );
    } catch (error) {
      console.error('Error cleaning up 2FA sessions:', error);
    }
  }
}

export const twoFactorService = new TwoFactorService();

// Clean up expired sessions every hour
setInterval(() => {
  twoFactorService.cleanupSessions();
}, 60 * 60 * 1000);