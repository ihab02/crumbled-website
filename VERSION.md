# Version History

## v1.2.0 - Secure Admin Authentication (2024-03-19)
- Implemented secure admin authentication system
- Features:
  - JWT-based authentication using Web Crypto API
  - Secure HTTP-only cookies
  - Rate limiting with account lockout
  - Password hashing with bcrypt
  - Proper middleware protection for admin routes
  - Development mode support without HTTPS requirement

### Database Changes
- Added `admin_users` table with security fields:
  - `login_attempts` for rate limiting
  - `locked_until` for account lockout
  - `last_login` tracking
  - Proper indexes for performance

### Security Features
- JWT signing and verification using Web Crypto API
- HTTP-only cookies with proper security settings
- Rate limiting (5 attempts) with 15-minute lockout
- Secure password hashing with bcrypt
- Server-side authentication in middleware
- Protection against common web vulnerabilities

### Default Admin Credentials
- Username: `admin`
- Password: `admin123`
- Note: Change default password in production

### Files Changed
- `middleware.ts`: Admin route protection
- `app/api/auth/admin/login/route.ts`: Login API
- `lib/db/admin_users.sql`: Database schema
- `scripts/generate-admin-password.js`: Password hash generation

### How to Revert
To revert to this version:
1. Restore the database schema from `lib/db/admin_users.sql`
2. Ensure all listed files are at their current state
3. Run `npm install` to ensure dependencies are correct 