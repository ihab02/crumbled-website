# Crumbled Application Architecture Documentation

## Overview
Crumbled is a full-stack e-commerce platform built with Next.js 14, React 18, TypeScript, and MySQL. The application serves as a cookie delivery service with comprehensive admin management capabilities.

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

#### Admin Components
- `AdminLayout`: Admin dashboard layout
- `SideMenu`: Navigation menu
- `OrderTable`: Order listing and management
- `ProductForm`: Product creation/editing
- `DeliveryAssignment`: Delivery personnel assignment

## API Architecture

### RESTful API Design

#### Customer APIs
```
GET    /api/products          # Product catalog
GET    /api/flavors           # Available flavors
GET    /api/cart              # Shopping cart
POST   /api/cart/add          # Add to cart
PUT    /api/cart/update       # Update cart item
DELETE /api/cart/remove       # Remove from cart
POST   /api/orders            # Create order
GET    /api/orders/:id        # Order details
POST   /api/auth/login        # Customer login
POST   /api/auth/register     # Customer registration
```

#### Admin APIs
```
GET    /api/admin/orders              # Order listing
GET    /api/admin/orders/:id          # Order details
PUT    /api/admin/orders/:id/status   # Update order status
GET    /api/admin/products            # Product management
POST   /api/admin/products            # Create product
PUT    /api/admin/products/:id        # Update product
DELETE /api/admin/products/:id        # Delete product
GET    /api/admin/delivery-men        # Delivery personnel
POST   /api/admin/delivery-men        # Add delivery person
PUT    /api/admin/delivery-men/:id    # Update delivery person
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
```

## State Management

### React Context Providers
```typescript
// Global state management
- CartProvider: Shopping cart state
- AuthProvider: Authentication state
- AdminAuthProvider: Admin authentication
- ThemeProvider: UI theme preferences
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
- **Local Development**: Next.js dev server
- **Database**: Local MySQL instance
- **File Storage**: Local file system
- **Environment Variables**: .env.local

### Production Environment
- **Hosting**: Vercel/Netlify deployment
- **Database**: Cloud MySQL instance
- **File Storage**: Cloud storage service
- **CDN**: Content delivery network
- **Monitoring**: Application monitoring

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

## Recent Updates & Enhancements

### Performance Improvements (Latest)
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

### Database Structure Improvements
1. **Enhanced Order Items Storage**: Added cached fields to `order_items` table
   - `product_name`: Cached product name at order time
   - `product_type`: Cached product type (individual/pack) at order time
   - `pack_size`: Cached pack size at order time
   - `flavor_details`: JSON field for complete flavor selection

2. **Admin View Preferences**: Added `admin_view_preferences` table
   - Per-user preferences for different admin views
   - Soft delete toggle functionality
   - Unique constraints for user-view combinations

3. **Performance Optimizations**: Added database indexes
   - Indexes on `product_name`, `product_type` in `order_items`
   - Indexes on `flavor_name` in `product_instance_flavor`

### Identified Performance Issues
1. **Excessive Cart Polling**: Cart API called every few seconds
   - **Before**: 30-50ms intervals causing unnecessary load
   - **After**: Implemented enhanced cart provider with caching and debouncing
   - **Solution**: 
     - 5-minute cache duration for cart data
     - 1-second debouncing for cart operations
     - Optimistic updates for better UX
     - Removed polling from header component

2. **Database Query Optimization**: Enhanced with cached fields
   - Historical data preservation in order items
   - Reduced complex joins for flavor details

## Future Enhancements

### Planned Features
1. **Mobile App**: React Native mobile application
2. **Real-time Updates**: WebSocket integration
3. **Advanced Analytics**: Business intelligence dashboard
4. **Multi-language Support**: Internationalization
5. **Payment Gateway**: Online payment integration
6. **Inventory Management**: Advanced stock tracking
7. **Customer Loyalty**: Rewards and referral system

### Technical Improvements
1. **Microservices**: Service-oriented architecture
2. **Caching Layer**: Redis caching implementation
3. **Message Queue**: Asynchronous processing
4. **API Versioning**: API version management
5. **GraphQL**: Alternative to REST APIs

This architecture documentation provides a comprehensive understanding of the Crumbled application's design, components, and implementation strategies for AI assistance. 