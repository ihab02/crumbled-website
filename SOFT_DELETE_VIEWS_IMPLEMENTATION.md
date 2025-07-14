# Database Views Soft Delete System - Implementation Plan

## Overview

This document outlines the comprehensive implementation of a soft delete system using database views for the Crumbled website. The system provides clean separation between active and deleted items with toggle functionality for admin users.

## Benefits of Database Views Approach

### 1. **Clean Separation**
- Views automatically filter out deleted items
- Customer-facing pages only see active items
- Admin pages can toggle between active and all items

### 2. **Performance Optimization**
- Views can be optimized with indexes
- Reduced query complexity in application code
- Centralized filtering logic

### 3. **Maintainability**
- Single source of truth for soft delete logic
- Easy to modify filtering rules
- Consistent behavior across all applications

### 4. **Backward Compatibility**
- Existing queries work without modification
- Gradual migration possible
- No breaking changes to existing APIs

## Database Schema Changes

### Phase 1: Add Soft Delete Columns

```sql
-- Add to products table
ALTER TABLE products 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by INT NULL,
ADD COLUMN deletion_reason VARCHAR(255) NULL;

-- Add to flavors table
ALTER TABLE flavors 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by INT NULL,
ADD COLUMN deletion_reason VARCHAR(255) NULL;

-- Add to product_types table
ALTER TABLE product_types 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by INT NULL,
ADD COLUMN deletion_reason VARCHAR(255) NULL;
```

### Phase 2: Create Database Views

#### Active Views (Customer-Facing)
```sql
-- active_products
CREATE VIEW active_products AS
SELECT p.*, pt.name as product_type_name
FROM products p
LEFT JOIN product_types pt ON p.product_type_id = pt.id
WHERE p.deleted_at IS NULL 
    AND p.is_active = true
    AND pt.deleted_at IS NULL;

-- active_flavors
CREATE VIEW active_flavors AS
SELECT f.*
FROM flavors f
WHERE f.deleted_at IS NULL 
    AND f.is_enabled = true;

-- active_product_types
CREATE VIEW active_product_types AS
SELECT * FROM product_types 
WHERE deleted_at IS NULL 
    AND is_active = true;
```

#### All Views (Admin with Toggle)
```sql
-- all_products
CREATE VIEW all_products AS
SELECT p.*, pt.name as product_type_name,
    CASE 
        WHEN p.deleted_at IS NOT NULL THEN 'deleted'
        WHEN p.is_active = false THEN 'disabled'
        ELSE 'active'
    END as status
FROM products p
LEFT JOIN product_types pt ON p.product_type_id = pt.id;

-- all_flavors
CREATE VIEW all_flavors AS
SELECT f.*,
    CASE 
        WHEN f.deleted_at IS NOT NULL THEN 'deleted'
        WHEN f.is_enabled = false THEN 'disabled'
        ELSE 'active'
    END as status
FROM flavors f;
```

### Phase 3: Stored Procedures

```sql
-- Soft delete procedures
CREATE PROCEDURE soft_delete_product(IN p_id INT, IN p_admin_id INT, IN p_reason VARCHAR(255))
CREATE PROCEDURE restore_product(IN p_id INT, IN p_admin_id INT)
CREATE PROCEDURE soft_delete_flavor(IN p_id INT, IN p_admin_id INT, IN p_reason VARCHAR(255))
CREATE PROCEDURE restore_flavor(IN p_id INT, IN p_admin_id INT)
```

## Application Layer Implementation

### 1. View Service (`lib/services/viewService.ts`)

**Key Features:**
- View selection based on context
- Admin preference management
- Soft delete/restore operations
- Statistics and reporting

**Usage Examples:**
```typescript
// Get active products (customer-facing)
const activeProducts = await ViewService.getProducts(false);

// Get all products (admin with toggle)
const allProducts = await ViewService.getProducts(true);

// Soft delete a product
await ViewService.softDelete('products', productId, adminId, 'Discontinued');
```

### 2. View Preferences Hook (`hooks/use-view-preferences.ts`)

**Features:**
- Persistent admin preferences
- Real-time toggle functionality
- Error handling and loading states

**Usage:**
```typescript
const { preferences, toggleShowDeleted, loading } = useViewPreferences('products');
```

### 3. View Toggle Component (`components/admin/ViewToggle.tsx`)

**Features:**
- Visual toggle switch
- Deleted item count badge
- Loading states
- Consistent styling

## API Updates

### 1. View Preferences API (`/api/admin/view-preferences`)

**Endpoints:**
- `GET /api/admin/view-preferences?view_type=products` - Get preferences
- `POST /api/admin/view-preferences` - Update preferences

### 2. Updated Product APIs

**Customer-Facing APIs:**
- Use `active_products` view by default
- No changes to existing endpoints

**Admin APIs:**
- Accept `show_deleted` parameter
- Use appropriate view based on preference
- Return status information for deleted items

## Admin Interface Updates

### 1. Header Toggle

Add view toggle to admin layout header:
```tsx
<ViewToggle 
  viewType="products" 
  deletedCount={deletedCount}
  onToggle={handleViewChange}
/>
```

### 2. Product Management Page

**Features:**
- Toggle between active and all products
- Visual indicators for deleted items
- Restore functionality
- Bulk operations

**UI Elements:**
- Status badges (Active, Disabled, Deleted)
- Restore buttons for deleted items
- Deletion reason display
- Deleted by information

### 3. Flavor Management Page

Similar to products with flavor-specific functionality.

## Migration Strategy

### Phase 1: Database Migration
1. Run migration script to add soft delete columns
2. Create database views
3. Create stored procedures
4. Add indexes for performance

### Phase 2: Application Updates
1. Update service layer to use views
2. Add view preferences system
3. Update admin APIs to support toggle
4. Add admin interface components

### Phase 3: Testing and Rollout
1. Test customer-facing functionality
2. Test admin toggle functionality
3. Migrate existing disabled items
4. Monitor performance

## Impact Analysis

### Affected Components

#### Customer-Facing
- ✅ **Shop pages** - Use active views
- ✅ **Product listings** - Filtered automatically
- ✅ **Cart functionality** - No impact
- ✅ **Order history** - Uses stored names

#### Admin Interface
- ✅ **Product management** - Enhanced with toggle
- ✅ **Flavor management** - Enhanced with toggle
- ✅ **Order management** - No impact
- ✅ **Analytics** - Enhanced with deletion stats

#### APIs
- ✅ **Customer APIs** - Use active views
- ✅ **Admin APIs** - Support toggle parameter
- ✅ **Order APIs** - No changes needed

### Performance Considerations

#### Database Performance
- Views add minimal overhead
- Indexes on `deleted_at` columns
- Stored procedures for efficient operations

#### Application Performance
- Cached view preferences
- Optimized queries with proper joins
- Minimal additional API calls

## Security Considerations

### Access Control
- Admin-only access to deleted items
- Audit trail with `deleted_by` and `deletion_reason`
- Proper authentication for view preferences

### Data Integrity
- Foreign key constraints maintained
- Order history preserved with stored names
- Soft delete prevents data loss

## Monitoring and Maintenance

### Metrics to Track
- Number of deleted items by type
- Deletion frequency and reasons
- View preference usage
- Performance impact

### Maintenance Tasks
- Regular cleanup of old deletion records
- Performance monitoring of views
- Backup and recovery procedures

## Future Enhancements

### Potential Improvements
1. **Bulk Operations** - Mass delete/restore
2. **Deletion Scheduling** - Automatic cleanup
3. **Advanced Filtering** - Date ranges, reasons
4. **Audit Reports** - Detailed deletion history
5. **Integration** - Export deleted items

### Scalability Considerations
- Partitioning for large datasets
- Archiving old deletion records
- Performance optimization for complex views

## Conclusion

The database views approach provides a robust, maintainable, and user-friendly solution for soft deletes. It offers:

- **Clean separation** between active and deleted items
- **Toggle functionality** for admin users
- **Performance optimization** through views and indexes
- **Backward compatibility** with existing code
- **Scalability** for future growth

This implementation ensures data integrity while providing the flexibility needed for effective content management. 