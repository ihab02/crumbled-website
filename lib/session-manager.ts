import { databaseService } from '@/lib/services/databaseService';
import { authConfig } from '@/lib/auth-config';

export interface Session {
  id: string;
  userId: string;
  userType: 'customer' | 'admin';
  sessionId: string;
  refreshToken: string;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface BlacklistedToken {
  token: string;
  reason: 'logout' | 'security' | 'expired';
  blacklistedAt: Date;
  expiresAt: Date;
}

class SessionManager {
  private blacklistedTokens = new Map<string, BlacklistedToken>();

  // Initialize session tables
  async initializeTables() {
    try {
      // Create sessions table
      await databaseService.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          user_type ENUM('customer', 'admin') NOT NULL,
          session_id VARCHAR(255) NOT NULL UNIQUE,
          refresh_token TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          INDEX idx_user_sessions (user_id, user_type),
          INDEX idx_session_id (session_id),
          INDEX idx_expires_at (expires_at)
        )
      `);

      // Create blacklisted tokens table
      await databaseService.query(`
        CREATE TABLE IF NOT EXISTS blacklisted_tokens (
          token_hash VARCHAR(255) PRIMARY KEY,
          token_type ENUM('access', 'refresh') NOT NULL,
          reason ENUM('logout', 'security', 'expired') NOT NULL,
          blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          INDEX idx_expires_at (expires_at)
        )
      `);

      console.log('Session tables initialized successfully');
    } catch (error) {
      console.error('Failed to initialize session tables:', error);
      throw error;
    }
  }

  // Create new session
  async createSession(
    userId: string,
    userType: 'customer' | 'admin',
    sessionId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Session> {
    try {
      // Check for existing active sessions
      const existingSessions = await databaseService.query<Session[]>(
        `SELECT * FROM user_sessions 
         WHERE user_id = ? AND user_type = ? AND is_active = true`,
        [userId, userType]
      );

      // Enforce maximum concurrent sessions
      if (existingSessions.length >= authConfig.maxConcurrentSessions) {
        // Deactivate oldest session
        const oldestSession = existingSessions.sort((a, b) => 
          new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime()
        )[0];

        await this.deactivateSession(oldestSession.sessionId);
      }

      const expiresAt = new Date(Date.now() + authConfig.refreshTokenExpiry * 1000);

      const session: Session = {
        id: sessionId,
        userId,
        userType,
        sessionId,
        refreshToken,
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
        expiresAt,
        ipAddress,
        userAgent
      };

      await databaseService.query(
        `INSERT INTO user_sessions 
         (id, user_id, user_type, session_id, refresh_token, expires_at, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [sessionId, userId, userType, sessionId, refreshToken, expiresAt, ipAddress, userAgent]
      );

      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  // Get session by session ID
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const sessions = await databaseService.query<Session[]>(
        `SELECT * FROM user_sessions WHERE session_id = ? AND is_active = true`,
        [sessionId]
      );

      if (sessions.length === 0) {
        return null;
      }

      const session = sessions[0];

      // Check if session has expired
      if (new Date() > new Date(session.expiresAt)) {
        await this.deactivateSession(sessionId);
        return null;
      }

      // Update last activity
      await this.updateLastActivity(sessionId);

      return session;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  // Update session last activity
  async updateLastActivity(sessionId: string): Promise<void> {
    try {
      await databaseService.query(
        `UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = ?`,
        [sessionId]
      );
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  // Deactivate session
  async deactivateSession(sessionId: string): Promise<void> {
    try {
      await databaseService.query(
        `UPDATE user_sessions SET is_active = false WHERE session_id = ?`,
        [sessionId]
      );
    } catch (error) {
      console.error('Failed to deactivate session:', error);
    }
  }

  // Deactivate all sessions for a user
  async deactivateAllUserSessions(userId: string, userType: 'customer' | 'admin'): Promise<void> {
    try {
      await databaseService.query(
        `UPDATE user_sessions SET is_active = false 
         WHERE user_id = ? AND user_type = ?`,
        [userId, userType]
      );
    } catch (error) {
      console.error('Failed to deactivate user sessions:', error);
    }
  }

  // Blacklist token
  async blacklistToken(token: string, tokenType: 'access' | 'refresh', reason: 'logout' | 'security' | 'expired'): Promise<void> {
    try {
      const tokenHash = this.hashToken(token);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await databaseService.query(
        `INSERT INTO blacklisted_tokens (token_hash, token_type, reason, expires_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
        [tokenHash, tokenType, reason, expiresAt]
      );

      // Also store in memory for faster access
      this.blacklistedTokens.set(tokenHash, {
        token,
        reason,
        blacklistedAt: new Date(),
        expiresAt
      });
    } catch (error) {
      console.error('Failed to blacklist token:', error);
    }
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token);

      // Check memory cache first
      const cached = this.blacklistedTokens.get(tokenHash);
      if (cached && new Date() < cached.expiresAt) {
        return true;
      }

      // Check database
      const [tokens] = await databaseService.query<any[]>(
        `SELECT * FROM blacklisted_tokens WHERE token_hash = ? AND expires_at > NOW()`,
        [tokenHash]
      );

      return tokens.length > 0;
    } catch (error) {
      console.error('Failed to check token blacklist:', error);
      return false;
    }
  }

  // Clean up expired sessions and tokens
  async cleanup(): Promise<void> {
    try {
      // Clean up expired sessions
      await databaseService.query(
        `UPDATE user_sessions SET is_active = false WHERE expires_at < NOW()`
      );

      // Clean up expired blacklisted tokens
      await databaseService.query(
        `DELETE FROM blacklisted_tokens WHERE expires_at < NOW()`
      );

      // Clean up memory cache
      const now = new Date();
      Array.from(this.blacklistedTokens.entries()).forEach(([hash, token]) => {
        if (now > token.expiresAt) {
          this.blacklistedTokens.delete(hash);
        }
      });
    } catch (error) {
      console.error('Failed to cleanup sessions:', error);
    }
  }

  // Update session refresh token
  async updateSessionRefreshToken(sessionId: string, refreshToken: string): Promise<void> {
    try {
      await databaseService.query(
        `UPDATE user_sessions SET refresh_token = ? WHERE session_id = ?`,
        [refreshToken, sessionId]
      );
    } catch (error) {
      console.error('Failed to update session refresh token:', error);
    }
  }

  // Hash token for storage
  private hashToken(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Get user sessions
  async getUserSessions(userId: string, userType: 'customer' | 'admin'): Promise<Session[]> {
    try {
      const sessions = await databaseService.query<Session[]>(
        `SELECT * FROM user_sessions 
         WHERE user_id = ? AND user_type = ? AND is_active = true
         ORDER BY last_activity DESC`,
        [userId, userType]
      );

      return sessions;
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }
}

export const sessionManager = new SessionManager(); 