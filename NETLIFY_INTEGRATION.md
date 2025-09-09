# Netlify Integration Guide - Foodbuy-procedural

This guide will help you deploy your Foodbuy-procedural project on Netlify and integrate it with your static IP proxy service.

## 🚀 **Step 1: Deploy Foodbuy-procedural to Netlify**

### **1.1 Connect Repository to Netlify**

1. **Go to Netlify Dashboard**
   - Visit [app.netlify.com](https://app.netlify.com)
   - Sign up/Login with your GitHub account

2. **Import Your Project**
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" as your Git provider
   - Authorize Netlify to access your repositories
   - Select `oos/Foodbuy-procedural` from the list

3. **Configure Build Settings**
   - **Repository**: `oos/Foodbuy-procedural`
   - **Branch**: `main` (or your default branch)
   - **Build Command**: (Auto-detected or specify based on your project)
   - **Publish Directory**: (Auto-detected or specify based on your project)

4. **Deploy**
   - Click "Deploy site"
   - Wait for deployment to complete
   - Note your Netlify URL: `https://your-site-name.netlify.app`

## 🔗 **Step 2: Integrate Static IP Proxy**

### **2.1 Set Environment Variables**

In your Netlify dashboard:
1. Go to **Site Settings** → **Environment Variables**
2. Add these variables:
   - `PROXY_SERVER_URL` = `https://static-ip-proxy.onrender.com`
   - `STATIC_IP` = `52.59.103.54`

### **2.2 Create Netlify Function for Proxy**

Create a new file in your Foodbuy-procedural repository:

**File: `netlify/functions/proxy.js`**

```javascript
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { targetUrl, method = 'GET', body, headers: requestHeaders } = JSON.parse(event.body || '{}');
    
    if (!targetUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'targetUrl is required',
          usage: 'Send POST request with { "targetUrl": "https://api.example.com/data" }'
        })
      };
    }

    const proxyUrl = process.env.PROXY_SERVER_URL || 'https://static-ip-proxy.onrender.com';
    
    const response = await fetch(`${proxyUrl}/proxy?url=${encodeURIComponent(targetUrl)}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...requestHeaders
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Proxy request failed',
        message: error.message 
      })
    };
  }
};
```

### **2.3 Update package.json (if needed)**

Add `node-fetch` dependency:

```json
{
  "dependencies": {
    "node-fetch": "^2.6.7"
  }
}
```

### **2.4 Client-Side Integration**

**Option A: Direct API Calls**

```javascript
// In your client-side JavaScript
class ProxyService {
  constructor() {
    this.proxyUrl = '/.netlify/functions/proxy';
  }

  async makeRequest(targetUrl, options = {}) {
    try {
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUrl,
          method: options.method || 'GET',
          body: options.body,
          headers: options.headers
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Proxy request failed:', error);
      throw error;
    }
  }

  // Convenience methods
  async get(url) {
    return this.makeRequest(url, { method: 'GET' });
  }

  async post(url, data) {
    return this.makeRequest(url, { 
      method: 'POST', 
      body: data 
    });
  }

  async put(url, data) {
    return this.makeRequest(url, { 
      method: 'PUT', 
      body: data 
    });
  }

  async delete(url) {
    return this.makeRequest(url, { method: 'DELETE' });
  }
}

// Usage example
const proxy = new ProxyService();

// Make API calls through your static IP
async function fetchData() {
  try {
    const data = await proxy.get('https://api.example.com/data');
    console.log('Data from static IP:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}
```

**Option B: Axios Integration**

```javascript
// If using Axios
import axios from 'axios';

const proxyApi = axios.create({
  baseURL: '/.netlify/functions/proxy',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to handle proxy requests
proxyApi.interceptors.request.use((config) => {
  if (config.proxyUrl) {
    config.data = {
      targetUrl: config.proxyUrl,
      method: config.method.toUpperCase(),
      body: config.data,
      headers: config.headers
    };
    config.url = '';
  }
  return config;
});

// Usage
async function fetchData() {
  try {
    const response = await proxyApi.post('', {
      proxyUrl: 'https://api.example.com/data'
    });
    return response.data;
  } catch (error) {
    console.error('Proxy request failed:', error);
  }
}
```

## 🧪 **Step 3: Test Integration**

### **3.1 Test Netlify Function**

```bash
# Test the proxy function
curl -X POST https://your-site-name.netlify.app/.netlify/functions/proxy \
  -H "Content-Type: application/json" \
  -d '{"targetUrl": "https://httpbin.org/ip"}'
```

### **3.2 Test from Browser Console**

```javascript
// Open browser console on your Netlify site
fetch('/.netlify/functions/proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ targetUrl: 'https://httpbin.org/ip' })
})
.then(response => response.json())
.then(data => console.log('Static IP:', data));
```

### **3.3 Verify Static IP**

The response should show your static IP: `52.59.103.54`

## 📁 **Step 4: Project Structure**

Your Foodbuy-procedural project should have this structure:

```
Foodbuy-procedural/
├── netlify/
│   └── functions/
│       └── proxy.js          # Netlify function for proxy
├── src/                      # Your source code
├── public/                   # Static assets
├── package.json              # Dependencies
└── netlify.toml             # Netlify configuration (optional)
```

## 🔧 **Step 5: Advanced Configuration**

### **5.1 Netlify Configuration (netlify.toml)**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"

[[headers]]
  for = "/.netlify/functions/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
```

### **5.2 Environment-Specific Configuration**

```javascript
// config/proxy.js
const config = {
  development: {
    proxyUrl: 'http://localhost:3000/proxy'
  },
  production: {
    proxyUrl: 'https://static-ip-proxy.onrender.com/proxy'
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors**
   - Ensure CORS headers are set in the Netlify function
   - Check that the proxy server allows your Netlify domain

2. **Function Not Found**
   - Verify the function is in `netlify/functions/` directory
   - Check that the function is properly exported

3. **Proxy Timeout**
   - Increase timeout in the proxy server configuration
   - Check Render logs for any issues

4. **Environment Variables**
   - Ensure `PROXY_SERVER_URL` is set in Netlify
   - Verify the proxy server URL is correct

## ✅ **Verification Checklist**

- [ ] Foodbuy-procedural deployed on Netlify
- [ ] Environment variables set
- [ ] Netlify function created
- [ ] Client-side integration implemented
- [ ] Static IP verified (`52.59.103.54`)
- [ ] API calls working through proxy
- [ ] CORS configured correctly

## 🎯 **Next Steps**

1. Deploy your Foodbuy-procedural project to Netlify
2. Create the proxy Netlify function
3. Update your client-side code to use the proxy
4. Test the integration
5. Verify all API calls use your static IP

Your Foodbuy-procedural application will now route all outbound requests through your static IP proxy, ensuring consistent IP addressing for any APIs that require IP whitelisting!
