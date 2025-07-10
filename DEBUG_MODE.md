# Debug Mode Feature

## Overview

The debug mode feature allows administrators to enable detailed logging throughout the application for troubleshooting and development purposes. When enabled, debug logs are displayed in both the server console (for backend operations) and browser console (for frontend operations).

## Features

### 🔧 Admin Control
- **Toggle Switch**: Located in `/admin/settings` page
- **Persistent State**: Debug mode setting is stored in the database
- **Immediate Effect**: Changes take effect immediately without server restart

### 📝 Logging Capabilities
- **Backend Logging**: Server-side operations and API calls
- **Frontend Logging**: Client-side component lifecycle and user interactions
- **Conditional Logging**: Debug logs only appear when debug mode is enabled
- **Performance Optimized**: Uses caching to minimize database queries

## Usage

### For Administrators

1. Navigate to `/admin/settings`
2. Find the "Debug Settings" section
3. Toggle the "Debug Mode" switch
4. Debug logs will immediately start appearing in:
   - **Server console** (terminal where `npm run dev` is running)
   - **Browser console** (F12 → Console tab)

### For Developers

#### Backend Debug Logging

```typescript
import { debugLog } from '@/lib/debug-utils';

// Simple debug log
await debugLog('User authentication successful', { userId: 123 });

// Debug log with callback (for expensive operations)
await debugLogCallback('Database query result', () => {
  return [expensiveData, metadata];
});
```

#### Frontend Debug Logging

```typescript
import { useDebugLogger } from '@/hooks/use-debug-mode';

function MyComponent() {
  const { debugLog, isDebugMode } = useDebugLogger();

  useEffect(() => {
    debugLog('Component mounted', { props, state });
  }, []);

  const handleClick = () => {
    debugLog('Button clicked', { timestamp: Date.now() });
  };
}
```

## Database Schema

The debug mode setting is stored in the `cart_settings` table:

```sql
ALTER TABLE cart_settings ADD COLUMN debug_mode BOOLEAN NOT NULL DEFAULT FALSE;
```

## API Endpoints

### GET /api/debug-mode
Returns the current debug mode status:
```json
{
  "success": true,
  "debugMode": true
}
```

### POST /api/admin/settings
Updates debug mode (along with other settings):
```json
{
  "debug_mode": true
}
```

## Architecture

### Components

1. **DebugModeProvider** (`hooks/use-debug-mode.tsx`)
   - React context for frontend debug mode state
   - Manages debug mode persistence and updates

2. **Debug Utils** (`lib/debug-utils.ts`)
   - Backend utility functions for debug logging
   - Database caching for performance

3. **Settings API** (`app/api/admin/settings/route.ts`)
   - Handles debug mode updates
   - Clears cache when settings change

4. **Debug Demo** (`components/debug-demo.tsx`)
   - Demonstration component showing debug logging
   - Only visible when debug mode is enabled

### Caching Strategy

- **30-second cache** for debug mode status
- **Automatic cache invalidation** when settings are updated
- **Fallback to false** if database query fails

## Best Practices

### When to Use Debug Logging

✅ **Good Use Cases:**
- API request/response logging
- Database query debugging
- Component lifecycle tracking
- Error investigation
- Performance monitoring

❌ **Avoid:**
- Sensitive information (passwords, tokens)
- High-frequency logging in production
- Logging in critical performance paths

### Performance Considerations

- Debug logs are completely disabled when debug mode is off
- Use `debugLogCallback` for expensive operations
- Cache debug mode status to avoid frequent database queries

## Troubleshooting

### Debug Mode Not Working

1. **Check Database**: Ensure `debug_mode` column exists in `cart_settings`
2. **Check Cache**: Clear browser cache and restart development server
3. **Check Console**: Look for errors in browser and server consoles
4. **Verify Settings**: Confirm debug mode is enabled in admin settings

### Migration Issues

If the `debug_mode` column doesn't exist, run:

```sql
ALTER TABLE cart_settings ADD COLUMN debug_mode BOOLEAN NOT NULL DEFAULT FALSE;
```

## Security Notes

- Debug mode should only be enabled during development or troubleshooting
- Debug logs may contain sensitive information
- Consider disabling debug mode in production environments
- Debug mode setting requires admin authentication 