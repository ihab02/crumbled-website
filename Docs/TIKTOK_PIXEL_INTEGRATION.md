# TikTok Pixel Integration Documentation

## Overview

This document provides a complete guide to the TikTok pixel integration implemented in the Crumbled website. The pixel tracks user interactions throughout the purchase funnel, from adding items to cart to completing payments.

## Table of Contents

1. [Base Pixel Setup](#base-pixel-setup)
2. [Event Implementation](#event-implementation)
3. [Cart Integration](#cart-integration)
4. [Checkout Flow](#checkout-flow)
5. [Order Completion](#order-completion)
6. [Customer Identification](#customer-identification)
7. [Debugging & Testing](#debugging--testing)
8. [Configuration](#configuration)

---

## Base Pixel Setup

### 1. Pixel ID
- **Pixel ID**: `D2CGNNJC77U4ENLN99MG`
- **Location**: `app/layout.tsx`

### 2. Base Pixel Code

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* TikTok Pixel Base Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w[t] = w[t] || [];
                w[t].push({
                  'ttq.load': 'D2CGNNJC77U4ENLN99MG'
                });
                var s = d.createElement('script');
                s.src = 'https://analytics.tiktok.com/i18n/pixel/sdk.js?s=${Date.now()}';
                s.async = true;
                d.head.appendChild(s);
              }(window, document, 'ttq');
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

### 3. TypeScript Declarations

```typescript
// types/tiktok-pixel.d.ts
declare global {
  interface Window {
    ttq: {
      track: (eventName: string, parameters?: any) => void;
      identify: (parameters?: any) => void;
      page: () => void;
      load: (pixelId: string) => void;
    };
  }
}

export {};
```

---

## Event Implementation

### 1. AddToCart Event

**Location**: `components/cart-provider.tsx`

```typescript
// Add item to cart
const addToCart = useCallback(async (item: CartItem) => {
  // Optimistic update logic...

  // TikTok Pixel - AddToCart Event
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.track('AddToCart', {
      content_type: 'product',
      content_id: item.id,
      content_name: item.name,
      currency: 'EGP',
      value: item.price,
      quantity: item.quantity
    });
  }

  // API update logic...
}, [debouncedCartUpdate, fetchCart])
```

**Event Parameters**:
- `content_type`: Always "product"
- `content_id`: Product ID
- `content_name`: Product name
- `currency`: "EGP" (Egyptian Pound)
- `value`: Product price
- `quantity`: Quantity added

### 2. InitiateCheckout Event

**Location**: `app/checkout-new/confirm/page.tsx`

```typescript
// Monitor checkout data changes
useEffect(() => {
  if (checkoutData?.cart?.total && typeof window !== 'undefined' && window.ttq) {
    console.log('🔍 Debug - Checkout Data:', checkoutData);
    console.log('🔍 Debug - Cart Total:', checkoutData.cart.total);
    console.log('🔍 Debug - TikTok Pixel:', window.ttq);
    console.log('🔍 Debug - Firing InitiateCheckout event');
    
    window.ttq.track('InitiateCheckout', {
      content_type: 'product',
      currency: 'EGP',
      value: checkoutData.cart.total,
      contents: checkoutData.cart.items.map((item: any) => ({
        content_id: item.id,
        content_name: item.name,
        quantity: item.quantity,
        price: item.basePrice
      }))
    });
  }
}, [checkoutData]);
```

**Event Parameters**:
- `content_type`: "product"
- `currency`: "EGP"
- `value`: Total cart value
- `contents`: Array of cart items with details

### 3. CompletePayment Event

**Location**: Multiple files for different scenarios

#### A. COD Orders (checkout-new/confirm/page.tsx)

```typescript
// TikTok Pixel - Identify + CompletePayment for COD
try {
  if (typeof window !== 'undefined' && window.ttq && orderData?.customerInfo) {
    const email = (orderData.customerInfo.email || '').trim().toLowerCase()
    const ph = (orderData.customerInfo.phone || '').replace(/\D/g, '')
    const phone = ph.startsWith('20') ? `+${ph}` : 
                  ph.startsWith('0') ? `+2${ph.slice(1)}` : 
                  ph.startsWith('1') && ph.length === 10 ? `+20${ph}` : 
                  (ph ? `+${ph}` : '')
    
    if (email || phone) {
      window.ttq.identify({ 
        ...(email ? { email } : {}), 
        ...(phone ? { phone_number: phone } : {}) 
      })
    }
    
    window.ttq.track('CompletePayment', {
      content_type: 'product',
      currency: 'EGP',
      value: orderData?.cart?.total || 0,
      content_id: (paymentResult.data?.orderId || '').toString(),
      content_name: 'Cookie Order',
      ...(email ? { email } : {}),
      ...(phone ? { phone_number: phone } : {}),
      contents: (orderData?.cart?.items || []).map((item: any) => ({
        content_id: (item.productId || item.id || '').toString(),
        content_name: item.name,
        quantity: item.quantity,
        price: item.total / Math.max(item.quantity || 1, 1),
      }))
    })
  }
} catch {}
```

#### B. Success Page (checkout/success/page.tsx)

```typescript
// TikTok Pixel - Identify + Purchase Event
if (typeof window !== 'undefined' && window.ttq) {
  debugLog('🔍 [DEBUG] Success page - TikTok Pixel available, preparing CompletePayment event')
  
  const emailNorm = normalizeEmail(data.order.customer_email)
  const phoneNorm = normalizeEgyptPhone(data.order.customer_phone)
  
  debugLog('🔍 [DEBUG] Success page - Customer identifiers:', { email: emailNorm, phone: phoneNorm })
  
  if (emailNorm || phoneNorm) {
    debugLog('🔍 [DEBUG] Success page - Calling ttq.identify')
    window.ttq.identify({
      ...(emailNorm ? { email: emailNorm } : {}),
      ...(phoneNorm ? { phone_number: phoneNorm } : {}),
    })
  }
  
  const eventData: any = {
    content_type: 'product',
    currency: 'EGP',
    value: parseFloat(data.order.total_amount),
    content_id: data.order.id.toString(),
    content_name: 'Cookie Order',
    contents: data.order.items?.map((item: any) => ({
      content_id: item.product_id?.toString() || item.id?.toString(),
      content_name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.unit_price)
    })) || []
  };
  
  // Optionally also include identifiers on the event payload
  if (emailNorm) eventData.email = emailNorm
  if (phoneNorm) eventData.phone_number = phoneNorm
  
  debugLog('🔍 [DEBUG] Success page - CompletePayment event data:', eventData)
  debugLog('🔍 [DEBUG] Success page - Firing CompletePayment event')
  
  window.ttq.track('CompletePayment', eventData);
  
  debugLog('🔍 [DEBUG] Success page - CompletePayment event fired successfully')
}
```

**Event Parameters**:
- `content_type`: "product"
- `currency`: "EGP"
- `value`: Total order amount
- `content_id`: Order ID
- `content_name`: "Cookie Order"
- `email`: Customer email (if available)
- `phone_number`: Customer phone (if available)
- `contents`: Array of order items

---

## Cart Integration

### 1. Cart Provider Setup

**File**: `components/cart-provider.tsx`

The cart provider includes TikTok pixel events for cart operations:

```typescript
// Fetch cart from API with caching
const fetchCart = useCallback(async (forceRefresh = false) => {
  // Try to fetch user cart first, fallback to session cart
  let response = await fetch('/api/cart/user')
  let data = await response.json()
  
  if (!response.ok || !data.success) {
    // Fallback to session-based cart
    response = await fetch('/api/cart')
    data = await response.json()
  }
  
  if (data.items) {
    setCart(data.items)
    const count = data.items.reduce((total: number, item: CartItem) => total + item.quantity, 0)
    setCartCount(count)
    setLastUpdated(now)
    lastFetchRef.current = now
  }
}, [])
```

### 2. Cart Merge Functionality

```typescript
// Handle cart merging when user logs in
const handleCartMerge = async () => {
  try {
    const response = await fetch('/api/cart/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      await fetchCart(true); // Refresh cart after merge
    }
  } catch (error) {
    console.error('Error merging cart:', error);
  }
};
```

---

## Checkout Flow

### 1. Checkout Start

**File**: `app/checkout-new/page.tsx`

The checkout page includes delivery fee calculation and address selection with TikTok pixel events.

### 2. Checkout Confirmation

**File**: `app/checkout-new/confirm/page.tsx`

```typescript
// Monitor checkout data changes for InitiateCheckout event
useEffect(() => {
  if (checkoutData?.cart?.total && typeof window !== 'undefined' && window.ttq) {
    window.ttq.track('InitiateCheckout', {
      content_type: 'product',
      currency: 'EGP',
      value: checkoutData.cart.total,
      contents: checkoutData.cart.items.map((item: any) => ({
        content_id: item.id,
        content_name: item.name,
        quantity: item.quantity,
        price: item.basePrice
      }))
    });
  }
}, [checkoutData]);
```

### 3. Order Placement

The order placement process includes:
- Cart validation
- Address confirmation
- Payment processing
- TikTok pixel CompletePayment event

---

## Order Completion

### 1. Success Page

**File**: `app/checkout/success/page.tsx`

The success page handles:
- Order data retrieval
- Customer identification
- CompletePayment event firing
- Fallback to localStorage if needed

### 2. Email Normalization

```typescript
const normalizeEmail = (email?: string) => (email || '').trim().toLowerCase()

const normalizeEgyptPhone = (phone?: string) => {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  // Build E.164 with leading +
  if (digits.startsWith('20')) return `+${digits}`
  if (digits.startsWith('0') && digits.length >= 10) return `+2${digits.slice(1)}`
  if (digits.startsWith('1') && digits.length === 10) return `+20${digits}`
  return digits ? `+${digits}` : ''
}
```

---

## Customer Identification

### 1. Identify Event

The `ttq.identify()` method is called with customer information:

```typescript
window.ttq.identify({
  ...(email ? { email } : {}),
  ...(phone ? { phone_number: phone } : {}),
})
```

### 2. Phone Number Formatting

Egyptian phone numbers are formatted to E.164 standard:
- `01271211171` → `+201271211171`
- `201271211171` → `+201271211171`
- `1271211171` → `+201271211171`

---

## Debugging & Testing

### 1. Debug Logging

All TikTok pixel events include comprehensive debug logging:

```typescript
debugLog('🔍 [DEBUG] Success page - TikTok Pixel available, preparing CompletePayment event')
debugLog('🔍 [DEBUG] Success page - Customer identifiers:', { email: emailNorm, phone: phoneNorm })
debugLog('🔍 [DEBUG] Success page - CompletePayment event data:', eventData)
debugLog('🔍 [DEBUG] Success page - Firing CompletePayment event')
```

### 2. TikTok Pixel Helper

Install the TikTok Pixel Helper browser extension to:
- Verify pixel loading
- Monitor event firing
- Validate event parameters
- Debug tracking issues

### 3. Console Logging

Check browser console for:
- Pixel loading status
- Event firing confirmations
- Error messages
- Debug information

---

## Configuration

### 1. Environment Variables

No specific environment variables are required for the TikTok pixel.

### 2. Pixel Settings

- **Pixel ID**: `D2CGNNJC77U4ENLN99MG`
- **Currency**: EGP (Egyptian Pound)
- **Content Type**: product
- **Event Names**: AddToCart, InitiateCheckout, CompletePayment

### 3. Event Parameters Summary

| Event | Required Parameters | Optional Parameters |
|-------|-------------------|-------------------|
| AddToCart | content_type, content_id, content_name, currency, value, quantity | - |
| InitiateCheckout | content_type, currency, value, contents | - |
| CompletePayment | content_type, currency, value, content_id, content_name, contents | email, phone_number |

---

## Implementation Checklist

### ✅ Base Setup
- [ ] Pixel ID configured in layout.tsx
- [ ] TypeScript declarations added
- [ ] Pixel loading verified

### ✅ Events Implemented
- [ ] AddToCart event in cart provider
- [ ] InitiateCheckout event in checkout confirm
- [ ] CompletePayment event in success page
- [ ] CompletePayment event in checkout confirm (COD)

### ✅ Customer Identification
- [ ] Email normalization function
- [ ] Phone number formatting (E.164)
- [ ] Identify event implementation
- [ ] Customer data validation

### ✅ Error Handling
- [ ] Window object checks
- [ ] Try-catch blocks
- [ ] Fallback mechanisms
- [ ] Debug logging

### ✅ Testing
- [ ] Pixel Helper extension installed
- [ ] Events firing verified
- [ ] Parameters validated
- [ ] Conversion tracking confirmed

---

## Troubleshooting

### Common Issues

1. **Pixel not loading**
   - Check pixel ID in layout.tsx
   - Verify script loading in browser console
   - Check for ad blockers

2. **Events not firing**
   - Verify window.ttq exists
   - Check event parameters
   - Review debug logs

3. **Customer identification issues**
   - Validate email/phone format
   - Check normalization functions
   - Verify identify event firing

4. **Conversion tracking problems**
   - Ensure CompletePayment fires after successful order
   - Verify order data availability
   - Check event parameter completeness

### Debug Commands

```javascript
// Test pixel loading
console.log('TikTok Pixel:', window.ttq);

// Test event firing
window.ttq.track('AddToCart', {
  content_type: 'product',
  content_id: 'test-123',
  content_name: 'Test Product',
  currency: 'EGP',
  value: 100,
  quantity: 1
});

// Test customer identification
window.ttq.identify({
  email: 'test@example.com',
  phone_number: '+201234567890'
});
```

---

## Files Modified

1. `app/layout.tsx` - Base pixel code
2. `types/tiktok-pixel.d.ts` - TypeScript declarations
3. `components/cart-provider.tsx` - AddToCart event
4. `app/checkout-new/confirm/page.tsx` - InitiateCheckout & CompletePayment events
5. `app/checkout/success/page.tsx` - CompletePayment event
6. `app/shop/product/[id]/page.tsx` - AddToCart event
7. `app/shop/pack/[id]/page.tsx` - AddToCart event
8. `app/customize-bundle/[id]/page.tsx` - AddToCart event

---

## Notes

- All events include comprehensive error handling
- Customer identification is implemented for better conversion tracking
- Debug logging is available throughout the implementation
- The pixel works with both guest and registered users
- Cart system updates are fully compatible with pixel events
- Multiple event firing points ensure reliable tracking

This implementation provides complete conversion funnel tracking from cart addition to order completion, enabling effective TikTok advertising optimization.
