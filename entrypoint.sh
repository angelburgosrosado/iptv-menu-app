#!/bin/sh

# Replace placeholders in JS files with runtime environment variables
for file in /usr/share/nginx/html/assets/*.js; do
  if [ -f "$file" ]; then
    echo "Replacing placeholders in $file..."
    sed -i "s|__VITE_FIREBASE_API_KEY__|${VITE_FIREBASE_API_KEY}|g" "$file"
    sed -i "s|__VITE_FIREBASE_AUTH_DOMAIN__|${VITE_FIREBASE_AUTH_DOMAIN}|g" "$file"
    sed -i "s|__VITE_FIREBASE_PROJECT_ID__|${VITE_FIREBASE_PROJECT_ID}|g" "$file"
    sed -i "s|__VITE_FIREBASE_STORAGE_BUCKET__|${VITE_FIREBASE_STORAGE_BUCKET}|g" "$file"
    sed -i "s|__VITE_FIREBASE_MESSAGING_SENDER_ID__|${VITE_FIREBASE_MESSAGING_SENDER_ID}|g" "$file"
    sed -i "s|__VITE_FIREBASE_APP_ID__|${VITE_FIREBASE_APP_ID}|g" "$file"
    sed -i "s|__VITE_API_URL__|${VITE_API_URL}|g" "$file"
  fi
done

# Execute Nginx CMD
exec nginx -g "daemon off;"
