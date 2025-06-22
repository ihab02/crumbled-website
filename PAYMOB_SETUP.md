# Paymob Payment Integration Setup

This guide explains how to set up Paymob payment integration for the Crumbled website.

## 🔧 Configuration

### 1. Environment Variables

Add the following variables to your `.env.local` file:

```env
# Paymob Configuration (Redirect Flow)
PAYMOB_API_KEY=your_paymob_api_key_here
PAYMOB_INTEGRATION_ID=your_integration_id_here
PAYMOB_BASE_URL=https://accept.paymob.com/api
# PAYMOB_IFRAME_ID=optional_for_redirect_flow
```

**Note:** For redirect flow (recommended), you only need the API key and integration ID. The iframe ID is optional and only needed if you want to embed the payment form in an iframe.

### 2. Paymob Account Setup

1. **Create Paymob Account**: Sign up at [Paymob](https://paymob.com)
2. **Get API Key**: From your Paymob dashboard
3. **Create Integration**: Set up a payment integration
4. **Get Integration ID**: Copy the integration ID from your dashboard
5. **Get Iframe ID** (Optional): Only needed if you want to embed the payment form in an iframe. For redirect flow, this is not required.

## �� Payment Flow

### 1. User Selects Paymob Payment
- User chooses "Pay with Paymob" in checkout
- System creates order in database with "Unpaid" status

### 2. Paymob Order Creation
- System calls Paymob API to create order
- Paymob returns order ID

### 3. Payment Key Generation
- System generates payment key with billing data
- Paymob returns payment token

### 4. Redirect to Paymob
- User is redirected to Paymob payment page
- **Redirect Flow URL**: `https://accept.paymob.com/api/acceptance/payments/pay?payment_token={token}`
- **Iframe Flow URL**: `https://accept.paymob.com/api/acceptance/iframes/{iframe_id}?payment_token={token}`

### 5. Payment Processing
- User completes payment on Paymob
- Paymob processes the payment

### 6. Callback Handling
- Paymob redirects back to: `/payment/callback?success=true&id={transaction_id}`
- System verifies payment with Paymob API
- Updates order status based on payment result

## 📋 API Endpoints

### Payment Processing
- **POST** `/api/checkout/payment` - Process payment and redirect to Paymob

### Payment Verification
- **POST** `/api/payment/verify` - Verify payment status after callback

### Webhook (Optional)
- **POST** `/api/payment/paymob-webhook` - Handle Paymob webhooks

## 🎯 Features

- ✅ **Redirect Flow**: Users are redirected to Paymob's secure payment page
- ✅ **Payment Verification**: Automatic verification of payment status
- ✅ **Order Management**: Automatic order status updates
- ✅ **Stock Management**: Stock restoration on failed payments
- ✅ **Error Handling**: Comprehensive error handling and user feedback
- ✅ **Security**: Secure payment processing through Paymob

## 🔒 Security Considerations

1. **API Key Security**: Keep your Paymob API key secure
2. **HTTPS**: Always use HTTPS in production
3. **Webhook Verification**: Verify webhook signatures (implemented in webhook handler)
4. **Transaction Verification**: Always verify transactions with Paymob API

## 🚀 Testing

### Test Mode
- Use Paymob's test environment for development
- Test with Paymob's test cards
- Verify callback handling

### Production Mode
- Switch to production Paymob environment
- Update environment variables
- Test with real payment methods

## 📞 Support

For Paymob integration issues:
1. Check Paymob documentation
2. Verify API credentials
3. Check server logs for errors
4. Contact Paymob support if needed

## 🔄 Webhook Setup (Optional)

To receive real-time payment updates:

1. **Configure Webhook URL**: Set webhook URL in Paymob dashboard
2. **URL**: `https://yourdomain.com/api/payment/paymob-webhook`
3. **Events**: Configure for transaction events
4. **Security**: Implement webhook signature verification

The webhook handler will automatically:
- Update order status
- Restore stock on failed payments
- Log transaction details 