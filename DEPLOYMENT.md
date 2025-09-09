# Deployment Guide - Static IP Proxy Server

## Quick Start Deployment

### Step 1: Initialize Git Repository
```bash
# Navigate to your project directory
cd /Users/oos/RB/static_IP_proxy

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Static IP Proxy Server"

# Set main branch
git branch -M main
```

### Step 2: Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `static-ip-proxy` (or your preferred name)
3. Don't initialize with README (we already have one)
4. Copy the repository URL

### Step 3: Push to GitHub
```bash
# Add remote origin (replace with your actual GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/static-ip-proxy.git

# Push to GitHub
git push -u origin main
```

### Step 4: Deploy on Render

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign up/Login with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `static-ip-proxy` repository

3. **Configure Service**
   - **Name**: `static-ip-proxy` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Starter` (free tier)

4. **Advanced Settings**
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `Yes` (recommended)

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (2-3 minutes)
   - Note your service URL: `https://your-service-name.onrender.com`

### Step 5: Test Your Deployment

1. **Health Check**
```bash
curl https://your-service-name.onrender.com/health
```

2. **Check Static IP**
```bash
curl https://your-service-name.onrender.com/ip
```

3. **Test Proxy**
```bash
curl "https://your-service-name.onrender.com/proxy?url=https://httpbin.org/ip"
```

### Step 6: Update Netlify Application

1. **Set Environment Variable**
   - In your Netlify dashboard, go to Site Settings → Environment Variables
   - Add: `PROXY_SERVER_URL` = `https://your-service-name.onrender.com`

2. **Update Your Code**
   - Use the proxy in your Netlify functions or client-side code
   - See `example-usage.js` for integration examples

## Verification Steps

### 1. Verify Static IP
```bash
# Check multiple times to ensure IP is consistent
curl https://your-service-name.onrender.com/ip
curl https://your-service-name.onrender.com/ip
curl https://your-service-name.onrender.com/ip
```

### 2. Test Proxy Functionality
```bash
# Test with a simple API
curl "https://your-service-name.onrender.com/proxy?url=https://jsonplaceholder.typicode.com/posts/1"

# Test with an IP checking service
curl "https://your-service-name.onrender.com/proxy?url=https://httpbin.org/ip"
```

### 3. Test from Netlify
Create a simple test in your Netlify function:
```javascript
// netlify/functions/test-proxy.js
exports.handler = async (event, context) => {
  const proxyUrl = process.env.PROXY_SERVER_URL;
  
  try {
    const response = await fetch(`${proxyUrl}/ip`);
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Proxy test successful',
        proxyIP: data.outbound_ip,
        timestamp: data.timestamp
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

## Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check Render logs for build errors
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **CORS Errors**
   - Ensure your Netlify domain is in the CORS configuration
   - Check if you're using HTTPS for both proxy and Netlify

3. **Proxy Not Working**
   - Verify the target URL is accessible
   - Check if the target URL requires authentication
   - Ensure the URL is properly encoded

4. **Static IP Not Consistent**
   - Render's free tier may have some IP variation
   - Consider upgrading to a paid plan for guaranteed static IP
   - Check Render's documentation for IP stability

### Debug Commands

```bash
# Check server logs
# In Render dashboard, go to your service → Logs

# Test locally
npm install
npm start
# Then test: http://localhost:3000/health
```

## Next Steps

1. **Monitor Usage**
   - Check Render dashboard for usage metrics
   - Monitor response times and errors

2. **Scale if Needed**
   - Upgrade to paid plan for better performance
   - Add more instances if needed

3. **Security Enhancements**
   - Add API key authentication if needed
   - Implement rate limiting
   - Add request logging

4. **Integration**
   - Update all your Netlify functions to use the proxy
   - Test thoroughly in staging environment
   - Monitor for any issues

## Support

- **Render Documentation**: https://render.com/docs
- **Netlify Functions**: https://docs.netlify.com/functions/overview/
- **Project Issues**: Create an issue in your GitHub repository
