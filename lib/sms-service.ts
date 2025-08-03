// This file is not used. Remove or update as needed.
// const sql = neon(process.env.DATABASE_URL!)

import { databaseService } from './services/databaseService';
import axios from 'axios';
import { debugLog } from './debug-utils';

interface CustomSMSConfig {
  baseUrl: string
  senderName: string
}

interface CustomSMSResponse {
  success: boolean
  messageId?: string
  status: string
  message: string
  rawResponse?: any
}

interface SMSResponse {
  success: boolean;
  message: string;
  data?: any;
}

class CustomSMSService {
  private config: CustomSMSConfig

  constructor() {
    this.config = {
      baseUrl: "http://3.250.91.63:1880",
      senderName: "Manex",
    }

    debugLog("SMS Service initialized with config:", {
      baseUrl: this.config.baseUrl,
      senderName: this.config.senderName,
    })
  }

  async sendSMS(phone: string, message: string): Promise<CustomSMSResponse> {
    try {
      // Format phone number for Egyptian numbers
      const formattedPhone = this.formatPhoneNumber(phone)
      
      // In development, log to console instead of sending SMS
      if (process.env.NODE_ENV === 'development') {
        debugLog('📱 [DEV MODE] SMS would be sent:')
        debugLog('   To:', formattedPhone)
        debugLog('   Message:', message)
        debugLog('   Sender:', this.config.senderName)
        debugLog('   URL:', `${this.config.baseUrl}/sendSMS`)
        
        return {
          success: true,
          messageId: `dev_${Date.now()}`,
          status: "sent",
          message: "SMS logged to console (development mode)",
          rawResponse: { development: true }
        }
      }

      const smsUrl = `${this.config.baseUrl}/sendSMS`

      debugLog(`🚀 Sending SMS to ${formattedPhone}`)
      debugLog(`📡 SMS URL: ${smsUrl}`)

      const payload = {
        senderName: this.config.senderName,
        messageType: "text",
        shortURL: false,
        recipients: formattedPhone,
        messageText: message,
      }

      debugLog("📦 SMS Payload:", JSON.stringify(payload, null, 2))

      // Add timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      let response: Response
      try {
        debugLog("📤 Sending SMS request...")
        response = await fetch(smsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "CrumbledCookies/1.0",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
        debugLog("📥 Received SMS response")
      } catch (fetchError) {
        clearTimeout(timeoutId)
        console.error("❌ SMS request failed:", fetchError)
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error("SMS request timed out after 15 seconds")
        }
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`)
      }

      clearTimeout(timeoutId)

      debugLog(`📨 SMS Response Status: ${response.status} ${response.statusText}`)

      let responseText: string
      try {
        responseText = await response.text()
        debugLog("📨 SMS Response Body:", responseText)
      } catch (textError) {
        console.error("❌ Failed to read SMS response:", textError)
        throw new Error("Failed to read SMS service response")
      }

      let result: any
      try {
        result = JSON.parse(responseText)
        debugLog("✅ Parsed JSON response:", result)
      } catch (parseError) {
        debugLog("⚠️ Response is not JSON, treating as text")
        result = {
          rawResponse: responseText,
          success: response.ok,
          message: response.ok ? "SMS sent successfully" : "SMS send failed",
        }
      }

      if (!response.ok) {
        console.error("❌ SMS API error:", response.status, responseText)
        throw new Error(`SMS API returned ${response.status}: ${responseText}`)
      }

      return {
        success: true,
        messageId: result.messageId || result.id || `sms_${Date.now()}`,
        status: result.status || "sent",
        message: result.message || "SMS sent successfully",
        rawResponse: result,
      }
    } catch (error) {
      console.error("❌ SMS Error:", error)
      throw new Error(`Failed to send SMS: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async sendVerificationCode(phone: string, code: string): Promise<CustomSMSResponse> {
    const message = `Your CrumbledCookies verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`
    return this.sendSMS(phone, message)
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, "")

    debugLog(`📞 Original phone: "${phone}" -> Cleaned: "${cleaned}"`)

    // Handle different Egyptian phone number formats
    if (cleaned.startsWith("+20")) {
      cleaned = cleaned.substring(3)
      debugLog("🇪🇬 Removed +20 prefix:", cleaned)
    } else if (cleaned.startsWith("20")) {
      cleaned = cleaned.substring(2)
      debugLog("🇪🇬 Removed 20 prefix:", cleaned)
    }

    // Ensure it starts with 0 for Egyptian format
    if (!cleaned.startsWith("0")) {
      cleaned = "0" + cleaned
      debugLog("🔢 Added leading 0:", cleaned)
    }

    // Validate Egyptian mobile number format (11 digits starting with 01)
    if (cleaned.length === 11 && cleaned.startsWith("01")) {
      debugLog("✅ Valid Egyptian mobile format:", cleaned)
      return cleaned
    }

    // If it's 10 digits starting with 1, add the 0
    if (cleaned.length === 10 && cleaned.startsWith("1")) {
      const formatted = "0" + cleaned
      debugLog("✅ Added 0 to 10-digit number:", formatted)
      return formatted
    }

    debugLog("⚠️ Using phone as-is (might not be standard Egyptian format):", cleaned)
    return cleaned
  }

  // Test method to verify SMS service is working
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      debugLog("🧪 Testing SMS service connection...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const testResponse = await fetch(`${this.config.baseUrl}/sendSMS`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderName: this.config.senderName,
          recipients: "01234567890",
          messageText: "Connection test",
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseText = await testResponse.text()
      debugLog(`🧪 Test response: ${testResponse.status} - ${responseText}`)

      return {
        success: testResponse.status < 500,
        message: testResponse.status < 500 ? "SMS service is reachable" : "SMS service error",
        details: {
          status: testResponse.status,
          response: responseText,
          url: `${this.config.baseUrl}/sendSMS`,
        },
      }
    } catch (error) {
      console.error("🧪 SMS service connection test failed:", error)
      return {
        success: false,
        message: "SMS service is not reachable",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          url: `${this.config.baseUrl}/sendSMS`,
        },
      }
    }
  }
}

// Create a singleton instance
export const smsService = new CustomSMSService();

export async function sendVerificationCode(phoneNumber: string, existingOtp?: string) {
  try {
    // Format phone number
    const formattedPhone = phoneNumber.replace(/\D/g, "")
    debugLog('📱 [SMS Service] Original phone:', phoneNumber)
    debugLog('📱 [SMS Service] Formatted phone:', formattedPhone)

    // Use existing OTP or generate a new one
    const code = existingOtp || Math.floor(100000 + Math.random() * 900000).toString()
    debugLog('🔑 [SMS Service] OTP code:', code)

    // Always send the SMS
    await smsService.sendVerificationCode(formattedPhone, code)

    // Store the verification code in MySQL with UTC timezone
    debugLog('⏰ [SMS Service] Storing OTP with 10-minute expiration (UTC)');
    debugLog('💾 [SMS Service] Inserting into database:', { phone: formattedPhone, code })

    const result = await databaseService.query(
      'INSERT INTO phone_verification (phone, verification_code, expires_at) VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL 10 MINUTE)',
      [formattedPhone, code]
    );
    
    debugLog('✅ [SMS Service] Database insert result:', result)

    return { success: true }
  } catch (error) {
    console.error("❌ [SMS Service] Error sending verification code:", error)
    throw error
  }
}

export async function verifyCode(phoneNumber: string, code: string) {
  try {
    const formattedPhone = phoneNumber.replace(/\D/g, "")

    // Check if code exists and is valid (using UTC timezone)
    const [result] = await databaseService.query(
      `SELECT 
        id,
        verification_code,
        expires_at,
        is_verified
      FROM phone_verification
      WHERE phone = ?
        AND verification_code = ?
        AND expires_at > UTC_TIMESTAMP()
        AND is_verified = false
      ORDER BY created_at DESC
      LIMIT 1`,
      [formattedPhone, code]
    );

    if (!Array.isArray(result) || result.length === 0) {
      return {
        success: false,
        error: "Invalid or expired verification code",
      }
    }

    // Mark as verified
    await databaseService.query(
      'UPDATE phone_verification SET is_verified = true WHERE id = ?',
      [result[0].id]
    );

    return { success: true }
  } catch (error) {
    console.error("Error verifying code:", error)
    throw error
  }
}

const CEQUENS_API_URL = 'https://apis.cequens.com/sms/v1/messages';
const CEQUENS_AUTH_TOKEN = process.env.CEQUENS_AUTH_TOKEN;
const SENDER_NAME = process.env.SMS_SENDER_NAME || 'Manex';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 100, // Maximum requests per window
  windowMs: 60 * 60 * 1000, // 1 hour window
  retryAfter: 60 * 1000 // 1 minute between retries
};

interface SMSResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface RateLimitRecord {
  phone: string;
  request_count: number;
  reset_time: Date;
}

async function isRateLimited(phone: string): Promise<boolean> {
  const now = new Date();
  const resetTime = new Date(now.getTime() + RATE_LIMIT.windowMs);

  try {
    // Clean up expired records
    await databaseService.query(
      'DELETE FROM sms_rate_limits WHERE reset_time < NOW()'
    );

    // Get or create rate limit record
    const result = await databaseService.query(
      'INSERT INTO sms_rate_limits (phone, request_count, reset_time) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE request_count = CASE WHEN sms_rate_limits.reset_time < NOW() THEN 1 ELSE sms_rate_limits.request_count + 1 END, reset_time = CASE WHEN sms_rate_limits.reset_time < NOW() THEN ? ELSE sms_rate_limits.reset_time END RETURNING *',
      [phone, resetTime, resetTime]
    );

    const record = result.rows[0] as RateLimitRecord;
    return record.request_count > RATE_LIMIT.maxRequests;
  } catch (error) {
    debugLog('Rate limit check error:', error);
    // If there's an error checking rate limit, allow the request
    return false;
  }
}

async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry strategy configuration
const RETRY_STRATEGY = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: 0.1
};

function calculateRetryDelay(attempt: number): number {
  const delay = Math.min(
    RETRY_STRATEGY.initialDelay * Math.pow(RETRY_STRATEGY.backoffFactor, attempt - 1),
    RETRY_STRATEGY.maxDelay
  );
  
  // Add jitter to prevent thundering herd
  const jitter = delay * RETRY_STRATEGY.jitter;
  return delay + (Math.random() * 2 - 1) * jitter;
}

async function sendSMSWithRetry(
  phone: string,
  message: string
): Promise<SMSResponse> {
  if (!CEQUENS_AUTH_TOKEN) {
    throw new Error('CEQUENS_AUTH_TOKEN is not configured');
  }

  if (await isRateLimited(phone)) {
    return {
      success: false,
      message: 'Rate limit exceeded. Please try again later.'
    };
  }

  let lastError: Error | null = null;
  let lastResponse: any = null;
  
  for (let attempt = 1; attempt <= RETRY_STRATEGY.maxRetries; attempt++) {
    try {
      const response = await fetch(CEQUENS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CEQUENS_AUTH_TOKEN}`
        },
        body: JSON.stringify({
          senderName: SENDER_NAME,
          messageType: 'text',
          shortURL: false,
          recipients: phone,
          messageText: message
        })
      });

      const data = await response.json();
      lastResponse = data;

      if (!response.ok) {
        // Don't retry on certain error types
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw new Error(data.message || 'Invalid request or authentication error');
        }
        throw new Error(data.message || 'Failed to send SMS');
      }

      // Log successful SMS
      await databaseService.query(
        'INSERT INTO sms_logs (phone, message, status, response_data) VALUES (?, ?, ?, ?)',
        [phone, message, 'success', JSON.stringify(data)]
      );

      return {
        success: true,
        message: 'SMS sent successfully',
        data
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      debugLog(`SMS sending attempt ${attempt} failed:`, error);

      // Log failed attempt
      await databaseService.query(
        'INSERT INTO sms_logs (phone, message, status, error_message, response_data) VALUES (?, ?, ?, ?, ?)',
        [phone, message, 'failed', lastError.message, JSON.stringify(lastResponse)]
      );

      if (attempt < RETRY_STRATEGY.maxRetries) {
        const delay = calculateRetryDelay(attempt);
        await wait(delay);
      }
    }
  }

  return {
    success: false,
    message: lastError?.message || 'Failed to send SMS after multiple attempts',
    data: lastResponse
  };
}

export async function sendOTP(phone: string, otp: string): Promise<SMSResponse> {
  const message = `Your verification code is: ${otp}. This code will expire in 5 minutes.`;
  return sendSMSWithRetry(phone, message);
}

export async function sendOrderStatusUpdate(phone: string, orderId: number, status: string): Promise<SMSResponse> {
  const message = `Your order #${orderId} status has been updated to: ${status}. Track your order at ${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}`;
  return sendSMSWithRetry(phone, message);
}

export async function sendOrderConfirmation(phone: string, orderId: number): Promise<SMSResponse> {
  const message = `Thank you for your order! Your order #${orderId} has been confirmed. Track your order at ${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}`;
  return sendSMSWithRetry(phone, message);
}

// Export the sendOrderNotification function
export async function sendOrderNotification(phone: string, orderId: number, status: string): Promise<SMSResponse> {
  const message = `Your order #${orderId} status has been updated to: ${status}. Thank you for choosing CrumbledCookies!`;
  return sendSMSWithRetry(phone, message);
}
