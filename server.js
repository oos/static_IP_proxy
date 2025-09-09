const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration for Netlify integration
app.use(cors({
  origin: [
    'https://*.netlify.app',
    'https://*.netlify.com',
    'http://localhost:3000', // For local development
    'http://localhost:8888'  // Netlify dev server
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// IP check endpoint - shows the outbound IP of this server
app.get('/ip', async (req, res) => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    res.json({
      outbound_ip: data.ip,
      timestamp: new Date().toISOString(),
      server_location: 'Render'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch IP address',
      message: error.message
    });
  }
});

// Proxy configuration
const proxyOptions = {
  target: '', // Will be set dynamically based on request
  changeOrigin: true,
  secure: true,
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({
      error: 'Proxy error',
      message: 'Failed to proxy request',
      details: err.message
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add custom headers if needed
    proxyReq.setHeader('X-Forwarded-For', req.ip);
    proxyReq.setHeader('X-Real-IP', req.ip);
    console.log(`Proxying ${req.method} ${req.url} to ${proxyReq.getHeader('host')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to response
    proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
};

// Dynamic proxy endpoint
app.use('/proxy', (req, res, next) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({
      error: 'Missing target URL',
      message: 'Please provide a target URL using ?url= parameter',
      example: '/proxy?url=https://api.example.com/data'
    });
  }

  // Validate URL
  try {
    new URL(targetUrl);
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid URL',
      message: 'Please provide a valid URL',
      provided: targetUrl
    });
  }

  // Create proxy middleware with dynamic target
  const dynamicProxy = createProxyMiddleware({
    ...proxyOptions,
    target: targetUrl,
    pathRewrite: {
      '^/proxy': '' // Remove /proxy prefix from the target URL
    }
  });

  dynamicProxy(req, res, next);
});

// Root endpoint with usage instructions
app.get('/', (req, res) => {
  res.json({
    message: 'Static IP Proxy Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      ip: '/ip',
      proxy: '/proxy?url=<target_url>'
    },
    usage: {
      description: 'Use this proxy to route requests through a static IP',
      example: `${req.protocol}://${req.get('host')}/proxy?url=https://api.example.com/data`,
      cors: 'Configured for Netlify applications'
    },
    documentation: 'https://github.com/your-repo/static-ip-proxy'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    available_endpoints: ['/health', '/ip', '/proxy']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Static IP Proxy Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 IP check: http://localhost:${PORT}/ip`);
  console.log(`🔄 Proxy endpoint: http://localhost:${PORT}/proxy?url=<target_url>`);
});

module.exports = app;
