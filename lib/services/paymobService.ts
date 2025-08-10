interface PaymobConfig {
  apiKey: string;
  integrationId: number;
  iframeId?: number;
  baseUrl: string;
}

interface PaymobOrderRequest {
  auth_token: string;
  delivery_needed: boolean;
  amount_cents: number;
  currency: string;
  items: Array<{
    name: string;
    amount_cents: number;
    description: string;
    quantity: number;
  }>;
}

interface PaymobOrderResponse {
  id: number;
  created_at: string;
  delivery_needed: boolean;
  merchant: {
    id: number;
    created_at: string;
    phones: string[];
    company_emails: string[];
    company_name: string;
    state: string;
    country: string;
    city: string;
    postal_code: string;
    street: string;
  };
  amount_cents: number;
  shipping_data: {
    id: number;
    first_name: string;
    last_name: string;
    street: string;
    building: string;
    floor: string;
    apartment: string;
    city: string;
    state: string;
    country: string;
    email: string;
    phone_number: string;
    postal_code: string;
    extra_description: string;
    shipping_method: string;
    order_id: number;
    order: number;
  };
  currency: string;
  is_payment_locked: boolean;
  is_return: boolean;
  is_cancel: boolean;
  is_returned: boolean;
  is_canceled: boolean;
  merchant_order_id: string;
  wallet_notification: any;
  paid_amount_cents: number;
  notify_me_with_emails: boolean;
  items: Array<{
    id: number;
    name: string;
    description: string;
    amount_cents: number;
    quantity: number;
  }>;
  order_url: string;
  commission_fees: number;
  delivery_fees_cents: number;
  delivery_vat_cents: number;
  payment_method: string;
  merchant_staff_tag: any;
  api_source: string;
  pickup_data: any;
  delivery_status: string;
  collector: any;
  data: any;
  url: string;
}

interface PaymobPaymentKeyRequest {
  auth_token: string;
  amount_cents: number;
  expiration: number;
  order_id: number;
  billing_data: {
    apartment: string;
    email: string;
    floor: string;
    first_name: string;
    street: string;
    building: string;
    phone_number: string;
    shipping_method: string;
    postal_code: string;
    city: string;
    country: string;
    last_name: string;
    state: string;
  };
  currency: string;
  integration_id: number;
  lock_order_when_paid: boolean;
  redirect_callback?: string;
  webhook_callback?: string;
}

interface PaymobPaymentKeyResponse {
  token: string;
  id: number;
}

class PaymobService {
  private config: PaymobConfig;

  constructor() {
    this.config = {
      apiKey: process.env.PAYMOB_API_KEY || '',
      integrationId: parseInt(process.env.PAYMOB_INTEGRATION_ID || '0'),
      iframeId: process.env.PAYMOB_IFRAME_ID ? parseInt(process.env.PAYMOB_IFRAME_ID) : undefined,
      baseUrl: process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api'
    };
  }

  async getAuthToken(): Promise<string> {
    try {
      // Getting auth token
      
      const response = await fetch(`${this.config.baseUrl}/auth/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.config.apiKey
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Paymob auth failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Paymob auth failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // Auth token received
      return data.token;
    } catch (error) {
      console.error('❌ Paymob auth error:', error);
      throw new Error('Failed to authenticate with Paymob');
    }
  }

  async createOrder(orderData: {
    amount: number;
    items: Array<{
      name: string;
      amount: number;
      description: string;
      quantity: number;
    }>;
    delivery_needed?: boolean;
  }): Promise<PaymobOrderResponse> {
    try {
      console.log('🛒 Creating Paymob order...');
      const authToken = await this.getAuthToken();

      const orderRequest: PaymobOrderRequest = {
        auth_token: authToken,
        delivery_needed: orderData.delivery_needed || false,
        amount_cents: Math.round(orderData.amount * 100), // Convert to cents
        currency: 'EGP',
        items: orderData.items.map(item => ({
          ...item,
          amount_cents: Math.round(item.amount * 100)
        }))
      };

      console.log('🔍 Paymob order request:', {
        amount_cents: orderRequest.amount_cents,
        currency: orderRequest.currency,
        delivery_needed: orderRequest.delivery_needed,
        items_count: orderRequest.items.length
      });

      const response = await fetch(`${this.config.baseUrl}/ecommerce/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Paymob order creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Paymob order creation failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Paymob order created:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Paymob order creation error:', error);
      throw new Error('Failed to create Paymob order');
    }
  }

  async generatePaymentKey(orderData: {
    orderId: number;
    amount: number;
    billingData: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      street: string;
      city: string;
      country: string;
      apartment?: string;
      floor?: string;
      building?: string;
      postal_code?: string;
      state?: string;
    };
  }): Promise<PaymobPaymentKeyResponse> {
    try {
      // Generating payment key
      const authToken = await this.getAuthToken();
      
      // Set up both callback URLs
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      const redirectCallbackUrl = `${baseUrl}/payment/callback`; // User redirect
      const webhookCallbackUrl = `${baseUrl}/api/payment/paymob-webhook`; // Server webhook

      const paymentKeyRequest: PaymobPaymentKeyRequest = {
        auth_token: authToken,
        amount_cents: Math.round(orderData.amount * 100),
        expiration: 3600, // 1 hour
        order_id: orderData.orderId,
        billing_data: {
          apartment: orderData.billingData.apartment || 'NA',
          email: orderData.billingData.email,
          floor: orderData.billingData.floor || 'NA',
          first_name: orderData.billingData.first_name,
          street: orderData.billingData.street,
          building: orderData.billingData.building || 'NA',
          phone_number: orderData.billingData.phone_number,
          shipping_method: 'NA',
          postal_code: orderData.billingData.postal_code || 'NA',
          city: orderData.billingData.city,
          country: orderData.billingData.country,
          last_name: orderData.billingData.last_name,
          state: orderData.billingData.state || 'NA'
        },
        currency: 'EGP',
        integration_id: this.config.integrationId,
        lock_order_when_paid: true,
        redirect_callback: redirectCallbackUrl,
        webhook_callback: webhookCallbackUrl
      };

      // Payment key request prepared with callbacks

      const response = await fetch(`${this.config.baseUrl}/acceptance/payment_keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentKeyRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Paymob payment key generation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Paymob payment key generation failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // Payment key generated successfully
      return data;
    } catch (error) {
      console.error('❌ Paymob payment key error:', error);
      throw new Error('Failed to generate Paymob payment key');
    }
  }

  getPaymentUrl(paymentKey: string): string {
    // For redirect flow, use the direct payment URL
    // If iframe ID is provided, use iframe URL, otherwise use redirect URL
    if (this.config.iframeId) {
      return `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentKey}`;
    } else {
      // Redirect flow - direct payment URL
      return `https://accept.paymob.com/api/acceptance/payments/pay?payment_token=${paymentKey}`;
    }
  }

  async verifyTransaction(transactionId: string): Promise<any> {
    try {
      console.log('🔍 Verifying Paymob transaction:', transactionId);
      const authToken = await this.getAuthToken();

      const response = await fetch(`${this.config.baseUrl}/acceptance/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Paymob transaction verification failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Paymob transaction verification failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Paymob transaction verified:', {
        id: data.id,
        success: data.success,
        amount_cents: data.amount_cents,
        payment_method: data.payment_method
      });
      return data;
    } catch (error) {
      console.error('❌ Paymob transaction verification error:', error);
      throw new Error('Failed to verify Paymob transaction');
    }
  }
}

export const paymobService = new PaymobService();
