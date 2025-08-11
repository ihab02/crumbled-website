# Cart System Implementation

## Overview

The cart system has been enhanced to support user-cart association, cross-device synchronization, and automatic cart merging when users log in.

## Key Features

### ✅ User-Cart Association
- Carts are now linked to user accounts when users are logged in
- `user_id` column in the `carts` table stores the user association
- `expires_at` column manages cart expiration based on settings

### ✅ Cross-Device Cart Access
- Logged-in users can access their cart from any device
- Cart data is synchronized across all user sessions
- Guest carts remain device-specific

### ✅ Automatic Cart Merging
- When a guest user logs in, their cart items are automatically merged
- Duplicate items have quantities combined
- Pack flavors are preserved during merging
- Guest cart is marked as abandoned after successful merge

### ✅ Cart Expiration Management
- Carts automatically expire based on `cart_settings.cart_lifetime_days`
- Default expiration is 7 days from creation
- Expired carts are marked as "abandoned"

## Database Schema

### Carts Table
```sql
CREATE TABLE carts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,                    -- Links cart to user account
    session_id VARCHAR(255) NOT NULL,
    status ENUM('active', 'abandoned', 'converted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,           -- Cart expiration date
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### Cart Settings Table
```sql
CREATE TABLE cart_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_lifetime_days INT NOT NULL DEFAULT 7,  -- Days until cart expires
    debug_mode BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Endpoints

### `/api/cart` (GET)
- Fetches cart items for current session
- Automatically associates cart with logged-in user
- Falls back to session cart if user cart not available

### `/api/cart/user` (GET)
- Fetches cart items for logged-in user
- Returns user's most recent active cart
- Requires authentication

### `/api/cart/merge` (POST)
- Merges guest cart with user cart when logging in
- Combines duplicate items
- Preserves pack flavors
- Updates cookie to point to user cart

### `/api/cart/add` (POST)
- Adds items to cart
- Automatically creates user-associated cart if logged in
- Supports both guest and user carts

## Cart Provider Features

### Automatic Cart Merging
```typescript
// Cart provider automatically attempts to merge carts when user logs in
useEffect(() => {
  const handleCartMerge = async () => {
    if (cart.length > 0) {
      await fetch('/api/cart/merge', { method: 'POST' });
      await fetchCart(true); // Refresh cart after merge
    }
  };
}, [cart.length]);
```

### User Cart Priority
```typescript
// Cart provider tries user cart first, falls back to session cart
const fetchCart = async () => {
  let response = await fetch('/api/cart/user');
  if (!response.ok) {
    response = await fetch('/api/cart'); // Fallback
  }
  // Process response...
};
```

## Cart Lifecycle

### Guest User Flow
1. **Add Items**: Creates session-based cart with `user_id = NULL`
2. **Browse**: Cart persists via cookie for 7 days
3. **Login**: Cart items are merged to user account
4. **Cross-Device**: Can access cart from any device

### Logged-in User Flow
1. **Add Items**: Creates user-associated cart with `user_id = user_id`
2. **Browse**: Cart linked to user account
3. **Cross-Device**: Cart accessible from any device
4. **Logout**: Cart remains associated with user account

## Maintenance

### Cleanup Expired Carts
```bash
npm run cleanup-carts
```

This script:
- Finds carts that have expired
- Marks them as "abandoned"
- Provides statistics on cart usage

### Database Migration
Run the migration script to update existing carts:
```sql
-- Update existing carts with expiration dates
UPDATE carts 
SET expires_at = DATE_ADD(created_at, INTERVAL 7 DAY)
WHERE expires_at IS NULL AND status = 'active';
```

## Configuration

### Cart Settings
Update cart lifetime in database:
```sql
UPDATE cart_settings SET cart_lifetime_days = 7;
```

### Environment Variables
No additional environment variables required. Uses existing database configuration.

## Benefits

### For Users
- ✅ Cart items persist across devices
- ✅ Seamless experience when logging in
- ✅ No lost items when switching devices
- ✅ Cart items remain after browser restart

### For Business
- ✅ Reduced cart abandonment
- ✅ Better user experience
- ✅ Improved conversion rates
- ✅ Better analytics on user behavior

## Troubleshooting

### Cart Not Syncing
1. Check if user is properly authenticated
2. Verify `user_id` is set in carts table
3. Check cart merge API response

### Expired Carts
1. Run cleanup script: `npm run cleanup-carts`
2. Check cart_settings table for lifetime configuration
3. Verify expires_at dates are set correctly

### Performance Issues
1. Ensure database indexes are created
2. Monitor cart API response times
3. Check for large cart items that may need cleanup

## Future Enhancements

- [ ] Cart sharing between users
- [ ] Cart templates/saved carts
- [ ] Cart analytics and reporting
- [ ] Cart backup/restore functionality
- [ ] Multi-cart support per user
