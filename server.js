const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const { Client } = require('ssh2-sftp-client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration for all applications
app.use(cors({
  origin: [
    'https://*.netlify.app',
    'https://*.netlify.com',
    'http://localhost:3000',
    'http://localhost:8888',
    '*' // Allow all origins for SFTP operations
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.0.0',
    features: ['http-proxy', 'sftp-tunneling', 'file-operations']
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
      server_location: 'Render',
      features: ['http-proxy', 'sftp-tunneling']
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch IP address',
      message: error.message
    });
  }
});

// HTTP Proxy configuration (existing functionality)
const proxyOptions = {
  target: '',
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
    proxyReq.setHeader('X-Forwarded-For', req.ip);
    proxyReq.setHeader('X-Real-IP', req.ip);
    console.log(`Proxying ${req.method} ${req.url} to ${proxyReq.getHeader('host')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
};

// HTTP Proxy endpoint (existing functionality)
app.use('/proxy', (req, res, next) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({
      error: 'Missing target URL',
      message: 'Please provide a target URL using ?url= parameter',
      example: '/proxy?url=https://api.example.com/data'
    });
  }

  try {
    new URL(targetUrl);
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid URL',
      message: 'Please provide a valid URL',
      provided: targetUrl
    });
  }

  const dynamicProxy = createProxyMiddleware({
    ...proxyOptions,
    target: targetUrl,
    pathRewrite: {
      '^/proxy': ''
    }
  });

  dynamicProxy(req, res, next);
});

// SFTP Connection endpoint
app.post('/sftp/connect', async (req, res) => {
  const { host, port, username, password, privateKey } = req.body;
  
  if (!host || !username) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'host and username are required',
      required: ['host', 'username'],
      optional: ['port', 'password', 'privateKey']
    });
  }

  try {
    const sftp = new Client();
    const config = {
      host,
      port: port || 22,
      username,
      readyTimeout: 20000,
      retries: 2,
      retry_minTimeout: 2000
    };

    if (password) {
      config.password = password;
    } else if (privateKey) {
      config.privateKey = privateKey;
    } else {
      return res.status(400).json({
        error: 'Authentication required',
        message: 'Either password or privateKey must be provided'
      });
    }

    await sftp.connect(config);
    
    // Store connection info (in production, use proper session management)
    const connectionId = Date.now().toString();
    req.app.locals.sftpConnections = req.app.locals.sftpConnections || {};
    req.app.locals.sftpConnections[connectionId] = sftp;

    res.json({
      success: true,
      connectionId,
      message: 'SFTP connection established',
      server: host,
      port: port || 22,
      username,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SFTP connection error:', error);
    res.status(500).json({
      error: 'SFTP connection failed',
      message: error.message,
      details: error.code || 'Unknown error'
    });
  }
});

// SFTP List files endpoint
app.get('/sftp/list/:connectionId', async (req, res) => {
  const { connectionId } = req.params;
  const { path: remotePath = '.' } = req.query;
  
  const sftp = req.app.locals.sftpConnections?.[connectionId];
  if (!sftp) {
    return res.status(404).json({
      error: 'Connection not found',
      message: 'SFTP connection not found or expired'
    });
  }

  try {
    const files = await sftp.list(remotePath);
    res.json({
      success: true,
      path: remotePath,
      files: files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        modifyTime: file.modifyTime,
        accessTime: file.accessTime,
        rights: file.rights
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('SFTP list error:', error);
    res.status(500).json({
      error: 'Failed to list files',
      message: error.message
    });
  }
});

// SFTP Download file endpoint
app.get('/sftp/download/:connectionId', async (req, res) => {
  const { connectionId } = req.params;
  const { path: remotePath } = req.query;
  
  if (!remotePath) {
    return res.status(400).json({
      error: 'Missing remote path',
      message: 'Please provide the remote file path using ?path= parameter'
    });
  }

  const sftp = req.app.locals.sftpConnections?.[connectionId];
  if (!sftp) {
    return res.status(404).json({
      error: 'Connection not found',
      message: 'SFTP connection not found or expired'
    });
  }

  try {
    const data = await sftp.get(remotePath);
    const filename = path.basename(remotePath);
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(data);
  } catch (error) {
    console.error('SFTP download error:', error);
    res.status(500).json({
      error: 'Failed to download file',
      message: error.message
    });
  }
});

// SFTP Upload file endpoint
app.post('/sftp/upload/:connectionId', upload.single('file'), async (req, res) => {
  const { connectionId } = req.params;
  const { path: remotePath } = req.body;
  
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      message: 'Please upload a file'
    });
  }

  if (!remotePath) {
    return res.status(400).json({
      error: 'Missing remote path',
      message: 'Please provide the remote destination path'
    });
  }

  const sftp = req.app.locals.sftpConnections?.[connectionId];
  if (!sftp) {
    return res.status(404).json({
      error: 'Connection not found',
      message: 'SFTP connection not found or expired'
    });
  }

  try {
    const localPath = req.file.path;
    const remoteFilePath = path.posix.join(remotePath, req.file.originalname);
    
    await sftp.put(localPath, remoteFilePath);
    
    // Clean up local file
    fs.unlinkSync(localPath);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      localFile: req.file.originalname,
      remotePath: remoteFilePath,
      size: req.file.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('SFTP upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      message: error.message
    });
  }
});

// SFTP Disconnect endpoint
app.post('/sftp/disconnect/:connectionId', async (req, res) => {
  const { connectionId } = req.params;
  
  const sftp = req.app.locals.sftpConnections?.[connectionId];
  if (!sftp) {
    return res.status(404).json({
      error: 'Connection not found',
      message: 'SFTP connection not found or expired'
    });
  }

  try {
    await sftp.end();
    delete req.app.locals.sftpConnections[connectionId];
    
    res.json({
      success: true,
      message: 'SFTP connection closed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('SFTP disconnect error:', error);
    res.status(500).json({
      error: 'Failed to disconnect',
      message: error.message
    });
  }
});

// Root endpoint with usage instructions
app.get('/', (req, res) => {
  res.json({
    message: 'Enhanced Static IP Proxy Server',
    version: '2.0.0',
    features: ['http-proxy', 'sftp-tunneling', 'file-operations'],
    endpoints: {
      health: '/health',
      ip: '/ip',
      proxy: '/proxy?url=<target_url>',
      sftp: {
        connect: 'POST /sftp/connect',
        list: 'GET /sftp/list/:connectionId?path=<remote_path>',
        download: 'GET /sftp/download/:connectionId?path=<remote_path>',
        upload: 'POST /sftp/upload/:connectionId',
        disconnect: 'POST /sftp/disconnect/:connectionId'
      }
    },
    usage: {
      description: 'Use this server to route requests through a static IP and handle SFTP operations',
      static_ip: '18.156.158.53',
      cors: 'Configured for all applications'
    },
    documentation: 'https://github.com/oos/static_IP_proxy'
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
    available_endpoints: ['/health', '/ip', '/proxy', '/sftp']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Static IP Proxy Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 IP check: http://localhost:${PORT}/ip`);
  console.log(`🔄 HTTP Proxy: http://localhost:${PORT}/proxy?url=<target_url>`);
  console.log(`📁 SFTP Operations: http://localhost:${PORT}/sftp/*`);
  console.log(`🔧 Features: HTTP Proxy + SFTP Tunneling + File Operations`);
});

module.exports = app;