# API Configuration Guide

This project supports dynamic API URL switching between local development and production environments.

## 🚀 Quick Setup

### Automatic Detection
The system automatically detects the environment based on:
- **Production**: When deployed to `shrijigroup.co.in`, `vercel.app`, `netlify.app`, `herokuapp.com`, or when `import.meta.env.PROD` is true
- **Local**: When running on `localhost`, `127.0.0.1`, or `192.168.x.x` domains

### Manual Configuration
You can override the automatic detection by setting environment variables.

## 📁 Environment Files

### Local Development
```bash
# Copy the local environment file
cp env.local .env
```

### Production
```bash
# Copy the production environment file
cp env.production .env
```

## 🔧 Environment Switcher Script

Use the provided script to easily switch between environments:

```bash
# Switch to local development
node switch-env.js local

# Switch to production
node switch-env.js production

# Switch to Vercel deployment
node switch-env.js vercel

# Show current configuration
node switch-env.js
```

## 🌐 API URLs

| Environment | API URL |
|-------------|---------|
| **Local** | `http://localhost:8000/api` |
| **Production** | `https://shrijigroup.co.in/public/api` |
| **Vercel** | `https://shrijigroup.co.in/public/api` |
| **Netlify** | `https://shrijigroup.co.in/public/api` |
| **Heroku** | `https://shrijigroup.co.in/public/api` |

## 🔍 Debugging

### Check Current Configuration
Open browser console to see the current API configuration:
```javascript
// The system logs the current configuration on startup
API Configuration: {
  isProduction: false,
  hostname: "localhost",
  apiUrl: "http://localhost:8000/api",
  viteEnv: undefined
}
```

### API Request Logging
In development mode, all API requests and responses are logged to the console.

## 🛠️ Manual Override

### Using Environment Variables
Create a `.env` file in the React root directory:

```env
# Force local API
VITE_API_BASE_URL=http://localhost:8000/api
VITE_ENVIRONMENT=local

# Force production API
VITE_API_BASE_URL=http://shrijigroup.co.in/public/api
VITE_ENVIRONMENT=production
```

### Using Code Override
You can also override the API URL in `src/config.js`:

```javascript
// Force a specific URL
export const API_BASE_URL = 'http://your-custom-api.com/api';
```

## 🚨 Troubleshooting

### Common Issues

1. **API calls failing after deployment**
   - Check if the production API URL is correct
   - Verify the server is running and accessible
   - Check browser console for error messages

2. **Local development not working**
   - Ensure Laravel server is running on port 8000
   - Check if `.env` file exists and has correct local URL
   - Verify CORS settings in Laravel

3. **Environment not switching**
   - Clear browser cache
   - Restart development server
   - Check if `.env` file is properly formatted

### Debug Steps

1. **Check Configuration**
   ```javascript
   // In browser console
   console.log(window.location.hostname);
   console.log(import.meta.env.PROD);
   ```

2. **Test API Connection**
   ```javascript
   // Test API endpoint
   fetch('http://shrijigroup.co.in/public/api/health')
     .then(response => console.log('API Status:', response.status))
     .catch(error => console.error('API Error:', error));
   ```

3. **Check Network Tab**
   - Open browser DevTools
   - Go to Network tab
   - Look for failed API requests
   - Check request URLs and response status

## 🚀 Vercel Deployment

### Automatic Configuration
When deployed to Vercel, the system automatically:
- Detects `vercel.app` hostname
- Uses production API URL: `https://shrijigroup.co.in/public/api`
- Sets environment variables via `vercel.json`

### Manual Vercel Configuration
If automatic detection fails, you can set environment variables in Vercel dashboard:
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add: `VITE_API_BASE_URL` = `https://shrijigroup.co.in/public/api`
4. Add: `VITE_ENVIRONMENT` = `production`

### Build for Vercel
```bash
# Build with Vercel configuration
npm run build:vercel

# Or use the default build (auto-detects Vercel)
npm run build
```

## 📝 Notes

- Environment variables must start with `VITE_` to be accessible in the frontend
- The system prioritizes explicit environment variables over automatic detection
- Production builds automatically use the production API URL
- Local development defaults to localhost API unless overridden
- Vercel deployments are automatically detected and configured
