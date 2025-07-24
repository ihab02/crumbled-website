# Crumbled Application Architecture Documentation

## Overview
Crumbled is a full-stack e-commerce platform built with Next.js 14, React 18, TypeScript, and MySQL. The application serves as a cookie delivery service with comprehensive admin management capabilities, advanced pricing systems, and robust soft delete functionality.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components
- **State Management**: React Context + Local State
- **Authentication**: NextAuth.js (Customer) + Custom JWT (Admin)

### Backend
- **Runtime**: Node.js
- **Database**: MySQL 8.0
- **ORM**: Custom Database Service Layer
- **Authentication**: JWT Tokens
- **File Upload**: Local Storage
- **SMS**: Custom SMS Service

### Infrastructure
- **Database**: MySQL with Connection Pooling
- **File Storage**: Local File System
- **Session Management**: HTTP-Only Cookies
- **Caching**: Browser-based caching
- **Debug Logging**: Conditional debug mode system

## Application Structure

### Directory Layout
```
crumbled-website/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout process
│   ├── flavors/           # Flavor selection
│   ├── shop/              # Product catalog
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
├── lib/                   # Utility libraries
│   ├── services/          # Business logic services
│   ├── db/                # Database schemas
│   └── middleware/        # Custom middleware
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── styles/                # Global styles
├── scripts/               # Deployment and utility scripts
└── Docs/                  # Documentation files
```

## Core Components

### 1. Authentication System

#### Customer Authentication (NextAuth.js)
```typescript
// Authentication flow
1. Customer registers/logs in via NextAuth.js
2. Session stored in HTTP-only cookies
3. Protected routes check session validity
4. Guest users can place orders with OTP verification

// Registration Pages
- /auth/signup: Basic registration (used in header/footer)
- /auth/register: Advanced registration with OTP verification (used in login page)
```

#### Registration Page Usage
- **Primary Registration**: `/auth/register` - Full registration with phone verification
- **Secondary Registration**: `/auth/signup` - Simplified registration for quick signup
- **Login Page Link**: Points to `/auth/register` for comprehensive registration
- **Header/Footer Links**: Point to `/auth/signup` for quick access

#### Admin Authentication (Custom JWT)
```typescript
// Admin authentication flow
1. Admin logs in via /admin/login
2. JWT token generated with admin claims
3. Token stored in 'adminToken' cookie
4. All admin APIs verify JWT token
5. Token contains admin user ID and permissions
```

### 2. Shopping Cart System

#### Cart Management
```typescript
// Cart flow
1. Cart created for customer/guest session
2. Items added to cart with flavor customization
3. Cart persisted in database with cart_id cookie
4. Real-time cart updates via API polling
5. Cart converted to order during checkout
```

#### Cart Components
- `CartProvider`: Context provider for cart state
- `CartDrawer`: Slide-out cart interface
- `CartItem`: Individual cart item display
- `FlavorSelector`: Flavor customization component

### 3. Product Catalog System

#### Product Hierarchy
```
Product Types (Cookies, Packs, Bundles)
    ↓
Products (Individual items)
    ↓
Product Instances (Size/Price configurations)
    ↓
Flavor Combinations (Customizable selections)
```

#### Product Components
- `ProductCard`: Product display card
- `FlavorGrid`: Flavor selection interface
- `SizeSelector`: Size selection component
- `ProductGallery`: Image gallery for products

### 4. Order Management System

#### Order Flow
```
1. Cart Checkout
   ↓
2. Customer Information Collection
   ↓
3. Delivery Address & Zone Selection
   ↓
4. Payment Method Selection
   ↓
5. Order Creation & Confirmation
   ↓
6. Admin Order Processing
   ↓
7. Delivery Assignment
   ↓
8. Order Fulfillment
```

#### Order Components
- `OrderSummary`: Order details display
- `OrderStatus`: Status tracking component
- `DeliveryInfo`: Delivery details form
- `PaymentForm`: Payment method selection

### 5. Debug Logging System

#### Debug Mode Features
- **Admin Control**: Toggle debug mode via admin settings
- **Conditional Logging**: Debug logs only appear when enabled
- **Performance Optimized**: Caching to minimize database queries
- **Multi-level Logging**: Backend and frontend debug capabilities

#### Debug Components
- `DebugModeProvider`: React context for debug mode state
- `DebugDemo`: Demonstration component for debug logging
- `useDebugLogger`: Hook for frontend debug logging
- `debugLog()`: Backend utility for conditional logging

#### Debug Implementation
```typescript
// Backend debug logging
import { debugLog } from '@/lib/debug-utils';
await debugLog('API called', { userId: 123 });

// Frontend debug logging
import { useDebugLogger } from '@/hooks/use-debug-mode';
const { debugLog } = useDebugLogger();
debugLog('Component mounted', { props });
```

### 6. Admin Dashboard System

#### Admin Features
- **Order Management**: View, update, and process orders
- **Product Management**: CRUD operations for products and flavors
- **Customer Management**: Customer data and order history
- **Delivery Management**: Assign delivery personnel
- **Analytics**: Sales and performance metrics
- **Inventory Management**: Stock tracking and updates
- **Promo Codes Management**: Create, edit, and manage promotional codes
- **Pricing Management**: Advanced product pricing and pricing rules management
- **View Preferences**: Per-user preferences for showing/hiding soft-deleted items

#### Admin Components
- `AdminLayout`: Admin dashboard layout
- `SideMenu`: Navigation menu
- `OrderTable`: Order listing and management
- `ProductForm`: Product creation/editing
- `DeliveryAssignment`: Delivery personnel assignment
- `ViewToggle`: Toggle for showing/hiding soft-deleted items

## Database Object Mappings

### Core Entity Relationships

#### Customer Management
```typescript
// Customer entity with soft delete support
interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password?: string; // Hashed for registered users
  type: 'guest' | 'registered';
  age_group: '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
  birth_date?: Date;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date; // Soft delete timestamp
  deleted_by?: number; // Admin who performed deletion
  deletion_reason?: string; // Reason for deletion
}

// Address entity
interface Address {
  id: number;
  customer_id: number;
  city_id: number;
  zone_id: number;
  street_address: string;
  is_default: boolean;
  created_at: Date;
}
```

#### Product Management with Soft Delete
```typescript
// Product entity with enhanced pricing
interface Product {
  id: number;
  product_type_id: number;
  name: string;
  description?: string;
  base_price: number;
  original_price?: number; // Original price for comparison
  sale_price?: number; // Current sale price
  sale_start_date?: Date; // Sale activation date
  sale_end_date?: Date; // Sale expiration date
  is_on_sale: boolean; // Whether product is currently on sale
  image_url?: string;
  is_active: boolean; // Product availability
  is_enabled: boolean; // Public visibility
  display_order: number; // Display ordering
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date; // Soft delete timestamp
  deleted_by?: number; // Admin who performed deletion
  deletion_reason?: string; // Reason for deletion
}

// Flavor entity with soft delete
interface Flavor {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  category: string; // Flavor category
  is_active: boolean; // Not deleted
  is_enabled: boolean; // Public visibility
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date; // Soft delete timestamp
  deleted_by?: number; // Admin who performed deletion
  deletion_reason?: string; // Reason for deletion
}

// Product instance with flavor combinations
interface ProductInstance {
  id: number;
  product_type: 'cookie' | 'pack' | 'bundle';
  product_id: number;
  size_id: number;
  base_price: number;
  is_active: boolean;
  created_at: Date;
  deleted_at?: Date; // Soft delete timestamp
}

// Flavor combination for product instances
interface ProductInstanceFlavor {
  id: number;
  product_instance_id: number;
  flavor_id: number;
  flavor_name: string; // Cached flavor name
  size_id: number;
  size_name: string; // Cached size name
  quantity: number;
  price_adjustment: number;
  created_at: Date;
}
```

#### Order Management with Enhanced Data
```typescript
// Order entity with promo code support
interface Order {
  id: number;
  customer_id?: number; // NULL for guest orders
  total: number;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number; // Promo code discount
  promo_code_id?: number; // Applied promo code
  promo_code?: string; // Promo code string for display
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_method: 'cash' | 'card' | 'online';
  payment_status: 'pending' | 'paid' | 'failed';
  delivery_address: string;
  delivery_city: string;
  delivery_zone: string;
  delivery_additional_info?: string;
  delivery_days: number;
  expected_delivery_date: Date;
  delivery_man_id?: number;
  delivery_time_slot_name?: string;
  from_hour?: string;
  to_hour?: string;
  guest_otp?: string; // For guest orders
  otp_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

// Order item with cached product data
interface OrderItem {
  id: number;
  order_id: number;
  product_instance_id: number;
  product_name: string; // Cached product name at order time
  product_type: 'individual' | 'pack'; // Cached product type at order time
  pack_size?: string; // Cached pack size (Mini, Medium, Large) at order time
  flavor_details: FlavorDetail[]; // JSON array of flavor selections
  quantity: number;
  unit_price: number;
  created_at: Date;
}

// Flavor detail structure
interface FlavorDetail {
  id: number;
  name: string;
  size: string;
  price: number;
  quantity: number;
}
```

#### Promo Codes System
```typescript
// Promo code entity
interface PromoCode {
  id: number;
  code: string; // Unique promo code (e.g., "WELCOME10")
  name: string; // Display name (e.g., "Welcome Discount")
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number; // Discount amount or percentage
  minimum_order_amount: number; // Minimum order for discount
  maximum_discount?: number; // Maximum discount cap
  usage_limit?: number; // Maximum usage count (NULL = unlimited)
  used_count: number; // Current usage count
  valid_from: Date; // Start date
  valid_until?: Date; // Expiration date
  is_active: boolean; // Whether code is active
  created_by: number; // Admin who created
  created_at: Date;
  updated_at: Date;
}

// Promo code usage tracking
interface PromoCodeUsage {
  id: number;
  promo_code_id: number;
  order_id: number;
  customer_id?: number; // NULL for guest orders
  customer_email?: string; // Customer email for tracking
  discount_amount: number; // Actual discount applied
  order_amount: number; // Order total before discount
  used_at: Date; // When code was used
}
```

#### Pricing Management System
```typescript
// Pricing rule entity
interface PricingRule {
  id: number;
  name: string; // Rule name (e.g., "Summer Sale", "VIP Discount")
  description?: string;
  rule_type: 'product' | 'category' | 'flavor' | 'time' | 'location' | 'customer_group';
  target_id?: number; // Product ID, category ID, etc.
  target_value?: string; // For non-ID targets like customer groups
  discount_type: 'percentage' | 'fixed_amount' | 'free_delivery';
  discount_value: number; // Discount amount or percentage
  minimum_order_amount: number; // Minimum order for discount
  maximum_discount?: number; // Maximum discount cap
  start_date: Date; // Rule activation date
  end_date?: Date; // Rule expiration date
  is_active: boolean; // Whether rule is active
  priority: number; // Higher priority rules apply first
  created_by: number; // Admin who created rule
  created_at: Date;
  updated_at: Date;
}

// Product pricing tiers
interface ProductPrice {
  id: number;
  product_id: number; // Reference to product
  price_type: 'regular' | 'sale' | 'member' | 'wholesale'; // Type of price
  price: number; // Price amount
  start_date: Date; // Price activation date
  end_date?: Date; // Price expiration date
  is_active: boolean; // Whether price is active
  created_by: number; // Admin who set price
  created_at: Date;
  updated_at: Date;
}

// Pricing categories
interface PricingCategory {
  id: number;
  name: string; // Category name (e.g., "Premium Flavors", "Bulk Orders")
  description?: string;
  category_type: 'product_type' | 'flavor_category' | 'size_category' | 'customer_group';
  target_value: string; // Category value (e.g., "Chocolate", "Large", "VIP")
  is_active: boolean; // Whether category is active
  created_at: Date;
  updated_at: Date;
}
```

#### Admin Management with View Preferences
```typescript
// Admin user entity
interface AdminUser {
  id: number;
  username: string;
  email: string;
  password: string; // Hashed password
  role: 'super_admin' | 'order_manager' | 'product_manager' | 'delivery_manager' | 'system_admin';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Admin view preferences
interface AdminViewPreference {
  id: number;
  admin_user_id: number;
  view_type: 'products' | 'flavors' | 'product_types' | 'orders';
  show_deleted: boolean; // Whether to show soft-deleted items
  created_at: Date;
  updated_at: Date;
}
```

## Soft Delete System

### Implementation Overview
The application implements a comprehensive soft delete system that maintains data integrity while allowing for data recovery and audit trails.

### Soft Delete Fields
All major entities include soft delete fields:
```typescript
interface SoftDeleteable {
  deleted_at?: Date; // Timestamp when item was soft deleted
  deleted_by?: number; // Admin user ID who performed deletion
  deletion_reason?: string; // Optional reason for deletion
}
```

### Soft Delete Stored Procedures
The system uses MySQL stored procedures for consistent soft delete operations:

#### `soft_delete_flavor(flavor_id, admin_user_id, reason)`
- Sets `deleted_at` to current timestamp
- Sets `deleted_by` to admin user ID
- Sets `deletion_reason` to provided reason
- Sets `is_active` to 0 (false)
- Maintains `is_enabled` status for potential restoration

#### `soft_delete_product(product_id, admin_user_id, reason)`
- Similar to flavor deletion
- Handles product-specific cleanup
- Maintains pricing and inventory relationships

#### `soft_delete_product_type(product_type_id, admin_user_id, reason)`
- Deletes product type with cascade considerations
- Maintains product relationships for potential restoration

#### `restore_flavor(flavor_id, admin_user_id)`
- Clears `deleted_at`, `deleted_by`, `deletion_reason`
- Sets `is_active` to 1 (true)
- Preserves original `is_enabled` status

### Public vs Admin Filtering

#### Public API Routes
All public-facing APIs filter out soft-deleted items:
```sql
-- Example: Public flavors API
SELECT * FROM flavors 
WHERE is_active = 1 
  AND is_enabled = 1 
  AND deleted_at IS NULL
```

#### Admin API Routes
Admin routes respect user preferences for showing deleted items:
```sql
-- Example: Admin flavors API with preference
SELECT * FROM flavors 
WHERE (deleted_at IS NULL OR show_deleted = 1)
  AND (is_enabled = 1 OR show_deleted = 1)
```

### Admin View Preferences
Each admin user can set preferences for different views:
- **Products View**: Show/hide deleted products
- **Flavors View**: Show/hide deleted flavors  
- **Product Types View**: Show/hide deleted product types
- **Orders View**: Show/hide cancelled orders

## API Architecture

### RESTful API Design

#### Customer APIs
```
GET    /api/products          # Product catalog (filtered)
GET    /api/flavors           # Available flavors (filtered)
GET    /api/cart              # Shopping cart
POST   /api/cart/add          # Add to cart
PUT    /api/cart/update       # Update cart item
DELETE /api/cart/remove       # Remove from cart
POST   /api/orders            # Create order
GET    /api/orders/:id        # Order details
POST   /api/auth/login        # Customer login
POST   /api/auth/register     # Customer registration
POST   /api/validate-promo-code # Validate promo code
```

#### Admin APIs
```
GET    /api/admin/orders              # Order listing
GET    /api/admin/orders/:id          # Order details
PUT    /api/admin/orders/:id/status   # Update order status
GET    /api/admin/products            # Product management
POST   /api/admin/products            # Create product
PUT    /api/admin/products/:id        # Update product
DELETE /api/admin/products/:id        # Soft delete product
GET    /api/admin/flavors             # Flavor management
POST   /api/admin/flavors             # Create flavor
PUT    /api/admin/flavors/:id         # Update flavor
DELETE /api/admin/flavors/:id         # Soft delete flavor
GET    /api/admin/delivery-men        # Delivery personnel
POST   /api/admin/delivery-men        # Add delivery person
PUT    /api/admin/delivery-men/:id    # Update delivery person
```

#### Promo Codes APIs
```
GET    /api/admin/promo-codes         # Fetch all promotional codes
POST   /api/admin/promo-codes         # Create new promotional code
PUT    /api/admin/promo-codes/:id     # Update existing promotional code
DELETE /api/admin/promo-codes/:id     # Delete promotional code
POST   /api/validate-promo-code       # Validate promo code for orders
```

#### Pricing Management APIs
```
GET    /api/admin/pricing-rules       # Fetch all pricing rules
POST   /api/admin/pricing-rules       # Create new pricing rule
PUT    /api/admin/pricing-rules/:id   # Update existing pricing rule
DELETE /api/admin/pricing-rules/:id   # Delete pricing rule
GET    /api/admin/product-prices      # Fetch product pricing
POST   /api/admin/product-prices      # Set product prices
PUT    /api/admin/product-prices/:id  # Update product prices
GET    /api/admin/pricing-categories  # Fetch pricing categories
POST   /api/admin/pricing-categories  # Create pricing category
PUT    /api/admin/pricing-categories/:id # Update pricing category
```

#### Admin View Preferences APIs
```
GET    /api/admin/view-preferences    # Get user view preferences
POST   /api/admin/view-preferences    # Set view preference
PUT    /api/admin/view-preferences/:id # Update view preference
```

### API Response Format
```typescript
// Success Response
{
  success: true,
  data: any,
  message?: string
}

// Error Response
{
  success: false,
  error: string,
  details?: any
}
```

## Database Service Layer

### Database Service Pattern
```typescript
// Database service structure
class DatabaseService {
  static async query(sql: string, params: any[]): Promise<any>
  static async transaction(callback: Function): Promise<any>
  static async connect(): Promise<void>
  static async disconnect(): Promise<void>
}
```

### Service Layer Architecture
```typescript
// Business logic services
- OrderService: Order processing and management
- ProductService: Product catalog operations
- CartService: Shopping cart operations
- CustomerService: Customer data management
- DeliveryService: Delivery operations
- AuthService: Authentication and authorization
- PricingService: Product pricing and pricing rules management
- PricingRuleService: Pricing rule operations and validation
- ProductPricingService: Product-specific pricing operations
- PromoCodeService: Promotional code management and validation
- SoftDeleteService: Soft delete operations and restoration
- AdminViewPreferenceService: Admin view preference management
```

## State Management

### React Context Providers
```typescript
// Global state management
- CartProvider: Shopping cart state
- AuthProvider: Authentication state
- AdminAuthProvider: Admin authentication
- ThemeProvider: UI theme preferences
- DebugModeProvider: Debug mode state
```

### Local State Management
```typescript
// Component-level state
- useState: Local component state
- useEffect: Side effects and data fetching
- useReducer: Complex state logic
- Custom hooks: Reusable state logic
```

## Security Implementation

### Authentication Security
1. **JWT Tokens**: Secure token-based authentication
2. **HTTP-Only Cookies**: XSS protection for tokens
3. **Password Hashing**: bcrypt for password storage
4. **Session Management**: Secure session handling
5. **CSRF Protection**: CSRF token validation

### Data Security
1. **Input Validation**: Comprehensive input sanitization
2. **SQL Injection Prevention**: Parameterized queries
3. **XSS Protection**: Content sanitization
4. **Rate Limiting**: API rate limiting
5. **Error Handling**: Secure error responses

## Performance Optimizations

### Frontend Optimizations
1. **Code Splitting**: Dynamic imports for route-based splitting
2. **Image Optimization**: Next.js Image component
3. **Caching**: Browser caching strategies
4. **Lazy Loading**: Component and image lazy loading
5. **Bundle Optimization**: Tree shaking and minification

### Backend Optimizations
1. **Database Indexing**: Optimized database queries
2. **Connection Pooling**: Efficient database connections
3. **Caching**: Application-level caching
4. **Query Optimization**: Efficient SQL queries
5. **Response Compression**: Gzip compression

### Cart System Optimizations
1. **Enhanced Cart Provider**: Complete cart state management overhaul
   - **Caching**: 5-minute cache duration for cart data
   - **Debouncing**: 1-second debounce for cart operations
   - **Optimistic Updates**: Immediate UI updates with error rollback
   - **API Endpoints**: New cart add/remove/update/clear endpoints
   - **Performance Monitor**: Real-time monitoring of API calls

2. **Cart API Optimization**: Eliminated excessive polling
   - **Before**: Cart API called every 30 seconds from header
   - **After**: Smart caching with manual refresh capability
   - **Result**: 90% reduction in unnecessary API calls

## Error Handling

### Error Types
```typescript
// Application error types
- ValidationError: Input validation errors
- AuthenticationError: Authentication failures
- DatabaseError: Database operation errors
- BusinessLogicError: Business rule violations
- SystemError: System-level errors
```

### Error Handling Strategy
1. **Global Error Boundary**: React error boundaries
2. **API Error Handling**: Consistent error responses
3. **User Feedback**: User-friendly error messages
4. **Logging**: Comprehensive error logging
5. **Recovery**: Graceful error recovery

## Testing Strategy

### Testing Levels
1. **Unit Tests**: Component and function testing
2. **Integration Tests**: API endpoint testing
3. **E2E Tests**: Full user journey testing
4. **Database Tests**: Data integrity testing

### Testing Tools
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Cypress**: E2E testing
- **Supertest**: API testing

## Deployment Architecture

### Development Environment
- **Local Development**: Next.js dev server (port 3001)
- **Database**: Local MySQL instance
- **File Storage**: Local file system
- **Environment Variables**: .env.local

### Production Environment
- **Hosting**: Vercel/Netlify deployment
- **Database**: Cloud MySQL instance
- **File Storage**: Cloud storage service
- **CDN**: Content delivery network
- **Monitoring**: Application monitoring

### Deployment Scripts
- **Linux/Unix**: `scripts/deploy-server.sh`
- **Windows**: `scripts/deploy-server.ps1`
- **Documentation**: `Docs/SERVER_DEPLOYMENT.md`

## Monitoring and Analytics

### Application Monitoring
1. **Error Tracking**: Error monitoring and alerting
2. **Performance Monitoring**: Response time tracking
3. **User Analytics**: User behavior tracking
4. **Business Metrics**: Sales and order analytics

### Logging Strategy
1. **Application Logs**: Request/response logging
2. **Error Logs**: Error tracking and debugging
3. **Business Logs**: Order and transaction logging
4. **Security Logs**: Authentication and access logs
5. **Debug Logs**: Conditional debug logging system

## Special Considerations for Development

### Database Considerations

#### Soft Delete Implementation
- **Consistency**: All soft delete operations use stored procedures
- **Performance**: Indexes on `deleted_at` fields for efficient filtering
- **Data Integrity**: Foreign key relationships maintained during soft delete
- **Recovery**: Complete restoration capability with audit trail

#### Cached Fields in Order Items
- **Historical Preservation**: Product names, types, and pack sizes cached at order time
- **Performance**: Reduces complex joins for order history queries
- **Data Integrity**: Preserves order data even if products are modified/deleted

#### Admin View Preferences
- **User-Specific**: Each admin can set preferences per view type
- **Flexibility**: Toggle between showing/hiding soft-deleted items
- **Performance**: Preferences cached to minimize database queries

### API Design Considerations

#### Public vs Admin Filtering
- **Public APIs**: Always filter out soft-deleted and disabled items
- **Admin APIs**: Respect user preferences for showing deleted items
- **Consistency**: Uniform filtering across all public endpoints

#### Promo Code Validation
- **Real-time Validation**: Validate codes during order creation
- **Usage Tracking**: Complete audit trail of code usage
- **Business Rules**: Enforce minimum orders, usage limits, and validity periods

#### Pricing Rule Application
- **Priority System**: Higher priority rules apply first
- **Flexible Targeting**: Product, category, customer group, and time-based rules
- **Performance**: Efficient rule evaluation with proper indexing

### Frontend Considerations

#### Cart System Optimization
- **Caching Strategy**: 5-minute cache with manual refresh
- **Debouncing**: 1-second debounce for cart operations
- **Optimistic Updates**: Immediate UI feedback with error rollback
- **API Efficiency**: Reduced polling and smart cache invalidation

#### Admin Interface Flexibility
- **View Toggles**: Easy switching between showing/hiding deleted items
- **Bulk Operations**: Efficient management of multiple items
- **Real-time Updates**: Immediate feedback for admin actions

### Performance Considerations

#### Database Indexing
- **Soft Delete Indexes**: Efficient filtering of deleted items
- **Cached Field Indexes**: Fast queries on order item cached fields
- **Composite Indexes**: Optimized queries for complex filtering

#### Caching Strategy
- **Multi-level Caching**: Browser, application, and database caching
- **Smart Invalidation**: Cache invalidation based on data changes
- **Performance Monitoring**: Real-time tracking of cache effectiveness

### Security Considerations

#### Soft Delete Security
- **Audit Trail**: Complete record of who deleted what and when
- **Access Control**: Only authorized admins can perform soft deletes
- **Data Recovery**: Secure restoration process with proper authorization

#### API Security
- **Input Validation**: Comprehensive validation for all inputs
- **Rate Limiting**: Protection against abuse
- **Error Handling**: Secure error responses without information leakage

## Future Enhancements

### Planned Features
1. **Mobile App**: React Native mobile application
2. **Real-time Updates**: WebSocket integration
3. **Advanced Analytics**: Business intelligence dashboard
4. **Multi-language Support**: Internationalization
5. **Payment Gateway**: Online payment integration
6. **Inventory Management**: Advanced stock tracking
7. **Customer Loyalty**: Rewards and referral system
8. **Product Pricing Management**: Advanced pricing strategies and rules

### Technical Improvements
1. **Microservices**: Service-oriented architecture
2. **Caching Layer**: Redis caching implementation
3. **Message Queue**: Asynchronous processing
4. **API Versioning**: API version management
5. **GraphQL**: Alternative to REST APIs

This architecture documentation provides a comprehensive understanding of the Crumbled application's design, components, and implementation strategies for AI assistance, including the latest soft delete system, admin view preferences, and special development considerations. 