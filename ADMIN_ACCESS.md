# Admin Panel Access Guide

## Default Admin Credentials

The admin panel uses separate authentication from the regular customer login. To access the admin panel:

**URL:** `/admin/login`

**Default Credentials:**
- **Username:** `admin`
- **Password:** `admin123`

## How to Access Admin Panel

1. Go to `/admin/login` in your browser
2. Enter the admin credentials above
3. You'll be redirected to `/admin/dashboard` after successful login
4. You can then access all admin features including:
   - `/admin/settings/payment-methods`
   - `/admin/flavors`
   - `/admin/delivery-management`
   - And other admin pages

## Important Notes

- Admin authentication is completely separate from customer authentication
- The admin token is stored in a separate cookie (`adminToken`)
- Regular customer accounts cannot access admin features
- You can be logged in as both a customer and admin simultaneously

## Security

⚠️ **Important:** Change the default admin password immediately after first login in production!

The default password is hardcoded for development purposes only. 