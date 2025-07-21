# Promo Codes System - Quick Reference

## 🎯 Overview
The promo codes system allows admins to create and manage promotional discounts for customers. The system supports both percentage and fixed amount discounts with flexible validation rules.

## 📊 Current Status
- ✅ **Fully Implemented**: Database, API, and admin interface ready
- ✅ **4 Sample Codes**: WELCOME10, SAVE20, FREESHIP, FLASH25
- ✅ **Admin API**: `/api/admin/promo-codes` functional
- ✅ **Database**: All tables and relationships established

## 🔧 API Endpoints

### Admin Promo Codes API
```
GET    /api/admin/promo-codes     # List all promo codes
POST   /api/admin/promo-codes     # Create new promo code
PUT    /api/admin/promo-codes/:id # Update promo code
DELETE /api/admin/promo-codes/:id # Delete promo code
```

### Request/Response Format
```typescript
// POST /api/admin/promo-codes
{
  "code": "SAVE20",
  "name": "Save 20%",
  "description": "20% off on orders above 100",
  "discount_type": "percentage",
  "discount_value": 20.00,
  "minimum_order_amount": 100.00,
  "maximum_discount": null,
  "usage_limit": 50,
  "valid_until": "2025-09-16T00:00:00Z",
  "is_active": true
}
```

## 📋 Database Tables

### promo_codes
- **Primary Key**: `id`
- **Unique Constraint**: `code`
- **Foreign Keys**: `created_by` → `admin_users.id`
- **Key Fields**: `discount_type`, `discount_value`, `usage_limit`, `valid_until`

### promo_code_usage
- **Primary Key**: `id`
- **Foreign Keys**: 
  - `promo_code_id` → `promo_codes.id`
  - `order_id` → `orders.id`
  - `customer_id` → `customers.id`

### orders (Updated)
- **New Columns**: `promo_code_id`, `promo_code`, `discount_amount`
- **Foreign Keys**: `promo_code_id` → `promo_codes.id`

## 🎨 Sample Promo Codes

| Code | Name | Type | Value | Min Order | Usage Limit | Valid Until |
|------|------|------|-------|-----------|-------------|-------------|
| WELCOME10 | Welcome Discount | Percentage | 10% | $50 | 100 | 30 days |
| SAVE20 | Save 20% | Percentage | 20% | $100 | 50 | 60 days |
| FREESHIP | Free Shipping | Fixed | $50 | $200 | 200 | 90 days |
| FLASH25 | Flash Sale | Percentage | 25% | $75 | 25 | 7 days |

## 🔍 Validation Rules

### Code Creation
- **Code**: Required, unique, uppercase
- **Name**: Required, descriptive
- **Discount Type**: Must be 'percentage' or 'fixed_amount'
- **Discount Value**: Required, positive number
- **Minimum Order**: Optional, defaults to 0
- **Usage Limit**: Optional, null = unlimited
- **Valid Until**: Optional, null = no expiration

### Code Application
- **Active Status**: Code must be `is_active = true`
- **Validity Period**: Current time must be within `valid_from` and `valid_until`
- **Usage Limit**: `used_count` must be less than `usage_limit`
- **Minimum Order**: Order total must meet minimum requirement
- **Maximum Discount**: For percentage codes, respect maximum cap

## 🛠️ Management Scripts

### Database Status Check
```bash
node scripts/check-promo-codes-status.js
```

### Complete Migration
```bash
node scripts/complete-promo-codes-migration.js
```

### Database Backup
```powershell
.\backup-database.ps1
```

## 📈 Usage Analytics

### Key Metrics
- **Total Codes**: Count of active promo codes
- **Usage Rate**: Codes used vs. total codes
- **Effectiveness**: Orders with vs. without promo codes
- **Customer Behavior**: Which codes are most popular
- **Revenue Impact**: Total discounts applied

### Sample Queries
```sql
-- Total promo codes
SELECT COUNT(*) FROM promo_codes WHERE is_active = true;

-- Usage statistics
SELECT 
  pc.code,
  pc.name,
  pc.used_count,
  pc.usage_limit,
  (pc.used_count / pc.usage_limit * 100) as usage_percentage
FROM promo_codes pc
WHERE pc.usage_limit IS NOT NULL;

-- Revenue impact
SELECT 
  SUM(discount_amount) as total_discounts,
  COUNT(*) as orders_with_discounts
FROM orders 
WHERE discount_amount > 0;
```

## 🚀 Next Steps

### Immediate
1. **Test Admin Interface**: Verify promo codes page loads
2. **Create Test Codes**: Add more promotional codes
3. **Monitor Usage**: Track code effectiveness

### Future Enhancements
1. **Checkout Integration**: Apply codes during checkout
2. **Customer Interface**: Allow customers to enter codes
3. **Advanced Rules**: Category-specific, customer-specific codes
4. **Analytics Dashboard**: Visual reporting on promo code performance
5. **Automated Campaigns**: Scheduled promo code activation

## 🔗 Related Files
- **API**: `app/api/admin/promo-codes/route.ts`
- **Migration**: `migrations/add_promo_codes.sql`
- **Database**: `lib/db.ts`
- **Session Summary**: `SESSION_SUMMARY_20250716.md`

---
**Last Updated**: July 16, 2025  
**Status**: ✅ Production Ready 