#!/bin/bash

# Script to add CORS headers for logo and other static assets
# This will allow the logo to be loaded in PDFs from different origins

echo "Adding CORS headers to nginx configuration for static assets..."

# Backup current configuration
sudo cp /etc/nginx/sites-available/crumbled-eg.com /etc/nginx/sites-available/crumbled-eg.com.backup.$(date +%Y%m%d_%H%M%S)

# Add CORS headers for static assets (logo, images, etc.)
if ! grep -q "add_header Access-Control-Allow-Origin" /etc/nginx/sites-available/crumbled-eg.com; then
    echo "Adding CORS headers for static assets..."
    
    # Add location block for static assets with CORS headers
    cat >> /etc/nginx/sites-available/crumbled-eg.com << 'EOF'

    # CORS headers for static assets (logo, images, etc.)
    location ~* \.(png|jpg|jpeg|gif|ico|svg|webp)$ {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
EOF
else
    echo "CORS headers already exist in configuration."
fi

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration is valid. Reloading nginx..."
    sudo systemctl reload nginx
    echo "CORS headers added successfully!"
    echo "The logo should now load properly in PDFs from any origin."
else
    echo "Nginx configuration test failed. Please check the configuration manually."
    echo "You can restore the backup with: sudo cp /etc/nginx/sites-available/crumbled-eg.com.backup.* /etc/nginx/sites-available/crumbled-eg.com"
    exit 1
fi
