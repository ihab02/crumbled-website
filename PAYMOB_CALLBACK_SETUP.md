# Paymob Callback URLs Setup Guide

This guide explains how to configure both callback URLs in your Paymob dashboard for the Crumbled website.

## 🔄 **Two Types of Callbacks**

Paymob uses two different callback mechanisms:

### 1. **Integration Response Callback URL** (User Redirect)
- **Purpose**: Redirects the user back to your website after payment
- **Method**: GET request with URL parameters
- **When**: After user completes/cancels payment on Paymob
- **User Experience**: User sees payment result page on your website

### 2. **Integration Processed Callback URL** (Server Webhook)
- **Purpose**: Server-to-server notification about payment status
- **Method**: POST request with JSON payload
- **When**: When Paymob processes the payment (real-time)
- **User Experience**: Background processing, user doesn't see this

## 🛠️ **Dashboard Configuration**

### Step 1: Access Paymob Dashboard
1. Log in to your [Paymob Dashboard](https://accept.paymob.com)
2. Navigate to **Payment Integrations**
3. Select your integration or create a new one

### Step 2: Configure Response Callback URL
1. Find the **"Integration Response Callback URL"** field
2. Set it to: `https://yourdomain.com/payment/callback`
3. **For Development**: `http://localhost:3001/payment/callback`
4. **For Production**: `https://yourdomain.com/payment/callback`

### Step 3: Configure Processed Callback URL
1. Find the **"Integration Processed Callback URL"** field
2. Set it to: `https://yourdomain.com/api/payment/paymob-webhook`
3. **For Development**: `http://localhost:3001/api/payment/paymob-webhook`
4. **For Production**: `https://yourdomain.com/api/payment/paymob-webhook`

## 📋 **Callback URL Examples**

### Development Environment
```
Response Callback: http://localhost:3001/payment/callback
Processed Callback: http://localhost:3001/api/payment/paymob-webhook
```

### Production Environment
```
Response Callback: https://crumbled.com/payment/callback
Processed Callback: https://crumbled.com/api/payment/paymob-webhook
```

## 🔍 **What Each Callback Does**

### Response Callback (`/payment/callback`)
- **Triggers**: When user completes payment on Paymob
- **Parameters**: `?success=true&order_id=123&transaction_id=456`
- **Action**: Shows payment result page to user
- **User Sees**: Success/failure message with order details

### Processed Callback (`/api/payment/paymob-webhook`)
- **Triggers**: When Paymob processes the payment
- **Data**: JSON payload with transaction details
- **Action**: Updates order status, sends emails, restores stock if needed
- **User Sees**: Nothing (background process)

## 🔧 **Testing Callbacks**

### Test Response Callback
1. Complete a test payment on Paymob
2. You should be redirected to: `http://localhost:3001/payment/callback?success=true&order_id=123`
3. Verify the payment result page displays correctly

### Test Processed Callback
1. Send a test webhook to: `http://localhost:3001/api/payment/paymob-webhook`
2. Check server logs for webhook processing
3. Verify order status updates in database

## 🚨 **Important Notes**

### HTTPS Requirement
- **Production**: Both URLs must use HTTPS
- **Development**: HTTP is acceptable for localhost

### URL Accessibility
- **Response Callback**: Must be accessible to user's browser
- **Processed Callback**: Must be accessible to Paymob's servers

### Error Handling
- If response callback fails: User stays on Paymob page
- If processed callback fails: Order status may not update

## 🔒 **Security Considerations**

### Response Callback
- Validate all URL parameters
- Don't trust success parameter alone
- Always verify with Paymob API

### Processed Callback
- Verify webhook signature (if available)
- Validate transaction data
- Handle duplicate webhooks

## 📝 **Configuration Checklist**

- [ ] Response Callback URL set in Paymob dashboard
- [ ] Processed Callback URL set in Paymob dashboard
- [ ] URLs are accessible from Paymob servers
- [ ] HTTPS enabled for production
- [ ] Error handling implemented
- [ ] Webhook signature verification (optional)
- [ ] Test both callbacks work correctly

## 🐛 **Troubleshooting**

### Response Callback Issues
- **User not redirected**: Check URL in dashboard
- **Wrong parameters**: Verify URL structure
- **Page not found**: Ensure route exists

### Processed Callback Issues
- **Webhook not received**: Check URL accessibility
- **Order not updated**: Check webhook handler logs
- **Duplicate processing**: Implement idempotency

## 📞 **Support**

If you have issues with callback configuration:
1. Check Paymob dashboard settings
2. Verify URLs are correct and accessible
3. Test with Paymob's test environment
4. Contact Paymob support if needed

## 🔄 **Flow Diagram**

```
User Payment Flow:
1. User clicks "Pay with Paymob"
2. Redirected to Paymob payment page
3. User completes payment
4. Paymob redirects to Response Callback URL
5. User sees payment result page

Server Processing Flow:
1. User completes payment on Paymob
2. Paymob sends webhook to Processed Callback URL
3. Server updates order status
4. Server sends confirmation email
5. Server restores stock if payment failed
``` 