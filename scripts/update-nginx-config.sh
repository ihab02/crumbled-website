#!/bin/bash

# Script to update nginx configuration to fix 413 Content Too Large error
# This script adds client_max_body_size directive to allow larger file uploads

echo "Updating nginx configuration to fix 413 error..."

# Backup current configuration
sudo cp /etc/nginx/sites-available/crumbled-eg.com /etc/nginx/sites-available/crumbled-eg.com.backup.$(date +%Y%m%d_%H%M%S)

# Check if client_max_body_size is already present
if grep -q "client_max_body_size" /etc/nginx/sites-available/crumbled-eg.com; then
    echo "client_max_body_size directive already exists. Updating to 50M..."
    sudo sed -i 's/client_max_body_size [0-9]*[KMG]/client_max_body_size 50M/g' /etc/nginx/sites-available/crumbled-eg.com
else
    echo "Adding client_max_body_size 50M directive..."
    # Add the directive after the ssl_dhparam line
    sudo sed -i '/ssl_dhparam \/etc\/letsencrypt\/ssl-dhparams.pem;/a \    # Increase client body size for file uploads (50MB)\n    client_max_body_size 50M;' /etc/nginx/sites-available/crumbled-eg.com
fi

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration is valid. Reloading nginx..."
    sudo systemctl reload nginx
    echo "Nginx configuration updated successfully!"
    echo "The 413 error should now be resolved for file uploads up to 50MB."
else
    echo "Nginx configuration test failed. Please check the configuration manually."
    echo "You can restore the backup with: sudo cp /etc/nginx/sites-available/crumbled-eg.com.backup.* /etc/nginx/sites-available/crumbled-eg.com"
    exit 1
fi 