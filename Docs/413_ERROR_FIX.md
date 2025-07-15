# Fixing 413 "Content Too Large" Error

## Problem Description

The 413 "Content Too Large" error occurs when making POST requests to `/api/admin/flavors` with image files. This happens because:

1. **Nginx default limit**: Nginx has a default `client_max_body_size` of 1MB
2. **Next.js API limits**: API routes don't have explicit body size limits configured
3. **Large image uploads**: Multiple image files can easily exceed these limits

## Root Cause

The error occurs in this sequence:
1. User uploads multiple images when creating a flavor
2. FormData contains image files that exceed the server's body size limit
3. Nginx rejects the request with 413 status before it reaches the Next.js application
4. The API endpoint never receives the request

## Solution Implemented

### 1. Nginx Configuration Update

Added `client_max_body_size 50M;` to the nginx server block:

```nginx
server {
    listen 443 ssl http2;
    server_name crumbled-eg.com www.crumbled-eg.com;
    
    # ... SSL configuration ...
    
    # Increase client body size for file uploads (50MB)
    client_max_body_size 50M;
    
    # ... rest of configuration ...
}
```

### 2. Next.js Configuration Update

Updated `next.config.js` to add API route body size limits:

```javascript
const nextConfig = {
  // ... existing config ...
  
  // Configure API route body size limits
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
  },
  
  // ... rest of config ...
}
```

### 3. API Endpoint Validation

Added comprehensive file validation to both flavor API endpoints:

- **File type validation**: Only allows JPEG, PNG, GIF, WebP
- **Individual file size limit**: 10MB per image
- **Total request size limit**: 50MB total
- **Proper error messages**: Clear feedback for validation failures

## Files Modified

1. **Nginx Configuration Files**:
   - `crumbled-eg.com-fixed.conf`
   - `crumbled-eg.com-updated.conf`

2. **Next.js Configuration**:
   - `next.config.js`

3. **API Endpoints**:
   - `app/api/admin/flavors/route.ts`
   - `app/api/flavors/route.ts`

4. **Utility Script**:
   - `scripts/update-nginx-config.sh`

## Deployment Instructions

### Option 1: Automated Script (Recommended)

1. Upload the script to your production server:
   ```bash
   scp crumbled-website/scripts/update-nginx-config.sh user@your-server:/tmp/
   ```

2. Run the script on the server:
   ```bash
   ssh user@your-server
   cd /tmp
   chmod +x update-nginx-config.sh
   sudo ./update-nginx-config.sh
   ```

### Option 2: Manual Update

1. Edit the nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/crumbled-eg.com
   ```

2. Add this line after the SSL configuration:
   ```nginx
   client_max_body_size 50M;
   ```

3. Test and reload nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Option 3: Rebuild and Deploy

1. Rebuild the Next.js application with the updated configuration:
   ```bash
   npm run build
   ```

2. Deploy the updated application to your server

## Validation

After applying the fixes:

1. **Test small uploads**: Try uploading a single small image (< 1MB)
2. **Test medium uploads**: Try uploading multiple images totaling 5-10MB
3. **Test large uploads**: Try uploading multiple images totaling 20-30MB
4. **Test limits**: Try uploading files that exceed the 10MB per file or 50MB total limits

## Error Handling

The updated API endpoints now provide clear error messages:

- **413**: "Total request size exceeds maximum allowed size of 50MB"
- **400**: "Image X is too large. Maximum size is 10MB per image"
- **400**: "Invalid file type for image X. Allowed types: JPEG, PNG, GIF, WebP"

## Monitoring

Monitor the following after deployment:

1. **Nginx error logs**: `/var/log/nginx/crumbled-eg-error.log`
2. **Application logs**: Check for any new errors related to file uploads
3. **Server resources**: Monitor disk space and memory usage during large uploads

## Security Considerations

1. **File type validation**: Prevents malicious file uploads
2. **Size limits**: Prevents DoS attacks through large file uploads
3. **Rate limiting**: Consider implementing rate limiting for file uploads
4. **Virus scanning**: Consider implementing virus scanning for uploaded files

## Troubleshooting

### If 413 error persists:

1. Check nginx configuration:
   ```bash
   sudo nginx -t
   ```

2. Verify the directive was added:
   ```bash
   grep -n "client_max_body_size" /etc/nginx/sites-available/crumbled-eg.com
   ```

3. Check nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/crumbled-eg-error.log
   ```

4. Restart nginx completely:
   ```bash
   sudo systemctl restart nginx
   ```

### If validation errors occur:

1. Check the browser's developer tools for the exact error message
2. Verify file types and sizes before upload
3. Check the API endpoint logs for detailed error information

## Future Improvements

1. **Progressive uploads**: Implement chunked file uploads for very large files
2. **Image optimization**: Automatically resize/compress images before storage
3. **CDN integration**: Use a CDN for image storage and delivery
4. **Upload progress**: Add progress indicators for large file uploads 