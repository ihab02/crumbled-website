# Database Connection Issues & Solutions

## 🚨 Critical Issue: "Too many connections" Error

### **Problem Description**
Your application is experiencing "Too many connections" errors from MySQL, which can prevent the application from functioning properly.

### **Root Causes Identified**

#### 1. **Multiple Connection Pools**
- **`lib/db.ts`**: Main pool with `connectionLimit: 5`
- **`lib/debug-utils.ts`**: Was creating its own pool with `connectionLimit: 10`
- **`lib/db.js`**: Compiled version of main pool
- **Scripts**: Creating additional pools instead of using shared pool

**Total Potential Connections**: 20+ instead of intended 5

#### 2. **Connection Leaks**
- Connections not being properly released in error scenarios
- Long-running queries holding connections
- Missing `finally` blocks in some database operations

#### 3. **Inefficient Pool Configuration**
- High `connectionLimit` values
- No connection timeout settings
- No queue limits

### **Solutions Implemented**

#### 1. **Unified Connection Pool**
```typescript
// lib/db.ts - Optimized configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Goodmorning@1',
  database: process.env.DB_NAME || 'crumbled_nextDB',
  waitForConnections: true,
  connectionLimit: 5, // Reduced from 10
  queueLimit: 10, // Added queue limit
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  idleTimeout: 30000, // Reduced to 30 seconds
  acquireTimeout: 10000, // 10 second timeout
  timeout: 60000, // Query timeout
  maxIdle: 3 // Reduced idle connections
});
```

#### 2. **Shared Pool Usage**
- Modified `lib/debug-utils.ts` to use shared pool from `lib/db.ts`
- All database operations now use the same pool

#### 3. **Connection Monitoring**
- Added pool event listeners for monitoring
- Created monitoring scripts

### **Monitoring Tools**

#### 1. **Connection Monitor**
```bash
node scripts/monitor-db-connections.js
```
Shows:
- Total connections
- Active vs sleeping connections
- Long-running queries
- Connection details

#### 2. **Idle Connection Cleanup**
```bash
node scripts/kill-idle-connections.js
```
Kills connections that have been idle for >30 seconds

### **Best Practices**

#### 1. **Always Release Connections**
```typescript
let connection;
try {
  connection = await pool.getConnection();
  // ... database operations
} catch (error) {
  // ... error handling
} finally {
  if (connection) {
    connection.release(); // Always release!
  }
}
```

#### 2. **Use Transactions Properly**
```typescript
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  // ... operations
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

#### 3. **Avoid Nested Connections**
- Don't create new pools in functions
- Use the shared pool from `lib/db.ts`

### **Immediate Actions**

#### 1. **Restart Your Application**
```bash
# Stop the current server
# Then restart
npm run dev
```

#### 2. **Monitor Connections**
```bash
node scripts/monitor-db-connections.js
```

#### 3. **Kill Idle Connections (if needed)**
```bash
node scripts/kill-idle-connections.js
```

### **MySQL Configuration**

#### Check Current Settings
```sql
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'wait_timeout';
SHOW VARIABLES LIKE 'interactive_timeout';
```

#### Recommended Settings
```sql
SET GLOBAL max_connections = 100;
SET GLOBAL wait_timeout = 300;
SET GLOBAL interactive_timeout = 300;
```

### **Prevention Measures**

#### 1. **Connection Pool Monitoring**
- Monitor pool events in logs
- Set up alerts for high connection counts

#### 2. **Query Optimization**
- Use indexes properly
- Avoid long-running queries
- Use pagination for large datasets

#### 3. **Error Handling**
- Always release connections in `finally` blocks
- Handle connection timeouts gracefully
- Implement retry logic for transient errors

### **Debugging Connection Issues**

#### 1. **Check Active Connections**
```sql
SELECT 
  COUNT(*) as total_connections,
  COUNT(CASE WHEN Command = 'Sleep' THEN 1 END) as sleeping,
  COUNT(CASE WHEN Command != 'Sleep' THEN 1 END) as active
FROM information_schema.PROCESSLIST 
WHERE DB = 'crumbled_nextDB';
```

#### 2. **Find Long-Running Queries**
```sql
SELECT 
  ID, USER, HOST, COMMAND, TIME, STATE, INFO
FROM information_schema.PROCESSLIST 
WHERE DB = 'crumbled_nextDB' 
  AND TIME > 60
ORDER BY TIME DESC;
```

#### 3. **Kill Problematic Connections**
```sql
KILL [connection_id];
```

### **Performance Impact**

#### Before Fixes
- Multiple pools: 20+ potential connections
- No connection limits
- Connection leaks
- High memory usage

#### After Fixes
- Single shared pool: 5 connections max
- Proper connection management
- Connection monitoring
- Reduced memory usage

### **Monitoring Checklist**

- [ ] Monitor connection count regularly
- [ ] Check for long-running queries
- [ ] Review error logs for connection issues
- [ ] Monitor application performance
- [ ] Set up alerts for high connection usage

### **Emergency Procedures**

If you encounter "Too many connections" again:

1. **Immediate**: Kill idle connections
   ```bash
   node scripts/kill-idle-connections.js
   ```

2. **Short-term**: Restart application
   ```bash
   # Stop and restart your Next.js server
   ```

3. **Long-term**: Review and optimize queries
   - Check for connection leaks
   - Optimize slow queries
   - Review connection pool settings

### **Files Modified**

1. **`lib/db.ts`**: Optimized pool configuration
2. **`lib/debug-utils.ts`**: Use shared pool
3. **`lib/services/databaseService.ts`**: Better error handling
4. **`scripts/monitor-db-connections.js`**: New monitoring tool
5. **`scripts/kill-idle-connections.js`**: New cleanup tool

### **Next Steps**

1. **Deploy fixes** to production
2. **Monitor** connection usage
3. **Set up alerts** for connection issues
4. **Review** all database queries for optimization
5. **Consider** implementing connection pooling at the load balancer level

---

**Last Updated**: Current Date  
**Status**: ✅ Fixed - Monitor for recurrence
