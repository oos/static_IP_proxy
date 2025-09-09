// Netlify Function: Static IP Proxy Service
// This function routes requests through your static IP proxy

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORS headers for cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  };

  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse request body
    const requestBody = event.body ? JSON.parse(event.body) : {};
    const { 
      targetUrl, 
      method = 'GET', 
      body, 
      headers: requestHeaders = {},
      timeout = 30000 
    } = requestBody;
    
    // Validate required parameters
    if (!targetUrl) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'targetUrl is required',
          message: 'Please provide a target URL in the request body',
          usage: {
            method: 'POST',
            body: {
              targetUrl: 'https://api.example.com/data',
              method: 'GET', // optional, defaults to GET
              body: {}, // optional, for POST/PUT requests
              headers: {} // optional, additional headers
            }
          }
        })
      };
    }

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch (urlError) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Invalid URL format',
          message: 'Please provide a valid URL',
          provided: targetUrl
        })
      };
    }

    // Get proxy server URL from environment variables
    const proxyUrl = process.env.PROXY_SERVER_URL || 'https://static-ip-proxy.onrender.com';
    
    // Prepare request options
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Foodbuy-Procedural-Proxy/1.0',
        ...requestHeaders
      },
      timeout: timeout
    };

    // Add body for POST/PUT/PATCH requests
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      requestOptions.body = JSON.stringify(body);
    }

    console.log(`Proxying ${method} request to: ${targetUrl}`);
    
    // Make request through proxy
    const response = await fetch(`${proxyUrl}/proxy?url=${encodeURIComponent(targetUrl)}`, requestOptions);
    
    // Get response data
    const responseData = await response.text();
    let parsedData;
    
    try {
      parsedData = JSON.parse(responseData);
    } catch (parseError) {
      // If response is not JSON, return as text
      parsedData = responseData;
    }

    // Return successful response
    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'X-Proxy-Status': 'success',
        'X-Target-URL': targetUrl
      },
      body: JSON.stringify({
        success: true,
        status: response.status,
        data: parsedData,
        proxyInfo: {
          proxyUrl: proxyUrl,
          targetUrl: targetUrl,
          method: method,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Proxy function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Proxy request failed',
        message: error.message,
        timestamp: new Date().toISOString(),
        proxyUrl: process.env.PROXY_SERVER_URL || 'https://static-ip-proxy.onrender.com'
      })
    };
  }
};
