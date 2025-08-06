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
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Note:** For redirect flow (recommended), you only need the API key and integration ID. The iframe ID is optional and only needed if you want to embed the payment form in an iframe.

### 2. Paymob Account Setup

1. **Create Paymob Account**: Sign up at [Paymob](https://paymob.com)
2. **Get API Key**: From your Paymob dashboard
3. **Create Integration**: Set up a payment integration
4. **Get Integration ID**: Copy the integration ID from your dashboard
5. **Get Iframe ID** (Optional): Only needed if you want to embed the payment form in an iframe. For redirect flow, this is not required.

## 🔄 Payment Flow

### 1. User Selects Paymob Payment
- User chooses "Pay with Paymob" in checkout
- System creates order in database with "pending" status

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
- Paymob redirects back to: `/payment/callback?success=true&order_id={order_id}&transaction_id={transaction_id}`
- System verifies payment with Paymob API
- Updates order status based on payment result
- Sends confirmation email for successful payments

## 📋 API Endpoints

### Payment Processing
- **POST** `/api/checkout/payment` - Process payment and redirect to Paymob

### Payment Verification
- **POST** `/api/payment/verify` - Verify payment status after callback

### Webhook (Optional)
- **POST** `/api/payment/paymob-webhook` - Handle Paymob webhooks

### Testing Endpoints
- **GET** `/api/test-paymob-config` - Test Paymob configuration
- **POST** `/api/paymob/test-order` - Test Paymob order creation
- **POST** `/api/paymob/test-payment-key` - Test payment key generation

## 🎯 Features

- ✅ **Redirect Flow**: Users are redirected to Paymob's secure payment page
- ✅ **Payment Verification**: Automatic verification of payment status
- ✅ **Order Management**: Automatic order status updates
- ✅ **Stock Management**: Stock restoration on failed payments
- ✅ **Error Handling**: Comprehensive error handling and user feedback
- ✅ **Security**: Secure payment processing through Paymob
- ✅ **Email Notifications**: Automatic order confirmation emails
- ✅ **Webhook Support**: Real-time payment status updates

## 🔒 Security Considerations

1. **API Key Security**: Keep your Paymob API key secure
2. **HTTPS**: Always use HTTPS in production
3. **Webhook Verification**: Verify webhook signatures (implemented in webhook handler)
4. **Transaction Verification**: Always verify transactions with Paymob API
5. **Input Validation**: All inputs are validated before processing

## 🚀 Testing

### Quick Test (Recommended)
Run the simple test script that doesn't require external dependencies:

```bash
node scripts/test-paymob-simple.js
```

This will test:
- Configuration validation
- Authentication
- Payment verification
- Webhook handling

### Full Test (Optional)
If you want to test the complete flow including order creation:

```bash
node scripts/test-paymob-integration.js
```

**Note:** This requires Node.js 18+ for built-in fetch support, or you can install node-fetch:
```bash
npm install node-fetch
```

### Manual Testing
1. **Test Configuration**: Visit `/api/test-paymob-config`
2. **Test Order Flow**: Complete a test checkout with Paymob payment
3. **Test Callback**: Verify payment callback handling
4. **Test Webhook**: Send test webhook data to `/api/payment/paymob-webhook`

### Test Mode
- Use Paymob's test environment for development
- Test with Paymob's test cards
- Verify callback handling

### Production Mode
- Switch to production Paymob environment
- Update environment variables
- Test with real payment methods

## 🔧 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check API key is correct
   - Verify Paymob account is active
   - Check network connectivity

2. **Payment Key Generation Failed**
   - Verify integration ID is correct
   - Check billing data format
   - Ensure order amount is valid

3. **Callback Not Working**
   - Verify callback URL is correct
   - Check webhook configuration
   - Ensure server is accessible

4. **Order Status Not Updated**
   - Check webhook handler logs
   - Verify order ID mapping
   - Check database connectivity

5. **Test Script Errors**
   - **"Cannot find module 'node-fetch'"**: Use the simple test script instead
   - **"fetch is not defined"**: Update to Node.js 18+ or install node-fetch
   - **Configuration errors**: Check environment variables

### Debug Logs
Enable debug logging by checking console output for:
- `🔍 [DEBUG]` - Debug information
- `✅` - Success messages
- `❌` - Error messages
- `🔔` - Webhook messages
- `🔐` - Authentication messages
- `🛒` - Order creation messages
- `🔑` - Payment key messages

### Environment Variable Checklist
Make sure you have these in your `.env.local`:
```env
PAYMOB_API_KEY=your_actual_api_key
PAYMOB_INTEGRATION_ID=your_actual_integration_id
PAYMOB_BASE_URL=https://accept.paymob.com/api
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 📞 Support

For Paymob integration issues:
1. Check Paymob documentation at [developers.paymob.com](https://developers.paymob.com/egypt/accept-dashboard)
2. Verify API credentials
3. Check server logs for errors
4. Run the test script to identify issues
5. Contact Paymob support if needed

## 🔄 Webhook Setup (Optional)

To receive real-time payment updates:

1. **Configure Webhook URL**: Set webhook URL in Paymob dashboard
2. **URL**: `https://yourdomain.com/api/payment/paymob-webhook`
3. **Events**: Configure for transaction events
4. **Security**: Implement webhook signature verification

The webhook handler will automatically:
- Update order status
- Restore stock on failed payments
- Send confirmation emails
- Log transaction details

## 🔄 **Callback URLs Setup**

Paymob uses two different callback mechanisms that need to be configured in your dashboard:

### 1. **Integration Response Callback URL** (User Redirect)
- **Purpose**: Redirects user back to your website after payment
- **URL**: `https://yourdomain.com/payment/callback`
- **Method**: GET request with URL parameters

### 2. **Integration Processed Callback URL** (Server Webhook)
- **Purpose**: Server-to-server notification about payment status
- **URL**: `https://yourdomain.com/api/payment/paymob-webhook`
- **Method**: POST request with JSON payload

**📖 For detailed setup instructions, see: [PAYMOB_CALLBACK_SETUP.md](./PAYMOB_CALLBACK_SETUP.md)**

## 📝 Recent Updates

### v2.1.0 (Current)
- ✅ Fixed payment verification flow
- ✅ Improved error handling
- ✅ Added comprehensive testing
- ✅ Enhanced webhook handling
- ✅ Better stock management
- ✅ Improved email notifications
- ✅ Added debug logging
- ✅ Created simple test script (no dependencies)
- ✅ Aligned with official Paymob API documentation
- ✅ Enhanced troubleshooting guide

### v2.0.0
- ✅ Fixed payment verification flow
- ✅ Improved error handling
- ✅ Added comprehensive testing
- ✅ Enhanced webhook handling
- ✅ Better stock management
- ✅ Improved email notifications
- ✅ Added debug logging 