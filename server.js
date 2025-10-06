const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const { Client } = require('ssh2-sftp-client');

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store SFTP connections
const sftpConnections = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.1', // Updated version to indicate fix
    features: ['http-proxy', 'sftp-tunneling', 'file-operations']
  });
});

// Get static IP endpoint
app.get('/ip', (req, res) => {
  // Use a simple proxy to get our outbound IP
  const proxy = createProxyMiddleware({
    target: 'https://api.ipify.org',
    changeOrigin: true,
    pathRewrite: {
      '^/ip': ''
    },
    onProxyRes: (proxyRes, req, res) => {
      res.json({
        outbound_ip: proxyRes.body,
        timestamp: new Date().toISOString(),
        server_location: 'Render',
        features: ['http-proxy', 'sftp-tunneling']
      });
    }
  });
  
  proxy(req, res);
});

// SFTP Connect endpoint - FIXED VERSION
app.post('/sftp/connect', async (req, res) => {
  try {
    const { host, username, password, port = 22, privateKey } = req.body;
    
    if (!host || !username) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Host and username are required'
      });
    }
    
    // Generate connection ID
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create SFTP client - FIXED: Use proper constructor
    const sftpClient = new Client();
    
    // Connection configuration
    const config = {
      host,
      username,
      port: parseInt(port)
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
    
    // Connect to SFTP server
    await sftpClient.connect(config);
    
    // Store connection
    sftpConnections.set(connectionId, sftpClient);
    
    console.log(`✅ SFTP connection established: ${connectionId} to ${host}`);
    
    res.json({
      success: true,
      connectionId,
      message: `Connected to ${host} successfully`
    });
    
  } catch (error) {
    console.error('SFTP connection error:', error);
    res.status(500).json({
      error: 'SFTP connection failed',
      message: error.message,
      details: 'Connection attempt failed'
    });
  }
});

// SFTP List files endpoint
app.get('/sftp/list/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { path = '.' } = req.query;
    
    const sftpClient = sftpConnections.get(connectionId);
    if (!sftpClient) {
      return res.status(404).json({
        error: 'Connection not found',
        message: `Connection ${connectionId} not found or expired`
      });
    }
    
    // List files in directory
    const files = await sftpClient.list(path);
    
    res.json({
      success: true,
      files: files,
      path: path,
      count: files.length
    });
    
  } catch (error) {
    console.error('SFTP list error:', error);
    res.status(500).json({
      error: 'SFTP list failed',
      message: error.message
    });
  }
});

// SFTP Download file endpoint
app.get('/sftp/download/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { remotePath, localPath } = req.query;
    
    if (!remotePath) {
      return res.status(400).json({
        error: 'Missing remotePath parameter'
      });
    }
    
    const sftpClient = sftpConnections.get(connectionId);
    if (!sftpClient) {
      return res.status(404).json({
        error: 'Connection not found',
        message: `Connection ${connectionId} not found or expired`
      });
    }
    
    // Download file
    const data = await sftpClient.get(remotePath);
    
    // Set appropriate headers for file download
    const filename = remotePath.split('/').pop();
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    res.send(data);
    
  } catch (error) {
    console.error('SFTP download error:', error);
    res.status(500).json({
      error: 'SFTP download failed',
      message: error.message
    });
  }
});

// SFTP Upload file endpoint
app.post('/sftp/upload/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { remotePath, localPath } = req.body;
    
    if (!remotePath || !localPath) {
      return res.status(400).json({
        error: 'Missing remotePath or localPath'
      });
    }
    
    const sftpClient = sftpConnections.get(connectionId);
    if (!sftpClient) {
      return res.status(404).json({
        error: 'Connection not found',
        message: `Connection ${connectionId} not found or expired`
      });
    }
    
    // Upload file
    await sftpClient.put(localPath, remotePath);
    
    res.json({
      success: true,
      message: `File uploaded to ${remotePath} successfully`
    });
    
  } catch (error) {
    console.error('SFTP upload error:', error);
    res.status(500).json({
      error: 'SFTP upload failed',
      message: error.message
    });
  }
});

// SFTP Disconnect endpoint
app.post('/sftp/disconnect/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    
    const sftpClient = sftpConnections.get(connectionId);
    if (!sftpClient) {
      return res.status(404).json({
        error: 'Connection not found',
        message: `Connection ${connectionId} not found or expired`
      });
    }
    
    // Disconnect and remove from map
    await sftpClient.end();
    sftpConnections.delete(connectionId);
    
    console.log(`✅ SFTP connection closed: ${connectionId}`);
    
    res.json({
      success: true,
      message: `Connection ${connectionId} closed successfully`
    });
    
  } catch (error) {
    console.error('SFTP disconnect error:', error);
    res.status(500).json({
      error: 'SFTP disconnect failed',
      message: error.message
    });
  }
});

// Proxy endpoint for HTTP/HTTPS requests
app.get('/proxy', (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }
  
  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/proxy': ''
    },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-Forwarded-For', req.ip);
      proxyReq.setHeader('X-Proxy-Source', 'static-ip-proxy');
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    }
  });
  
  proxy(req, res);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Enhanced Static IP Proxy Server',
    version: '2.0.1',
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
      static_ip: '52.59.103.54',
      cors: 'Configured for all applications'
    },
    documentation: 'https://github.com/oos/static_IP_proxy'
  });
});

// Cleanup old connections periodically
setInterval(() => {
  console.log(`Active SFTP connections: ${sftpConnections.size}`);
}, 60000); // Log every minute

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down proxy server...');
  
  // Close all SFTP connections
  for (const [connectionId, sftpClient] of sftpConnections) {
    try {
      await sftpClient.end();
      console.log(`Closed connection: ${connectionId}`);
    } catch (error) {
      console.error(`Error closing connection ${connectionId}:`, error);
    }
  }
  
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Enhanced Static IP Proxy Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`SFTP endpoints: http://localhost:${PORT}/sftp/connect`);
  console.log(`Static IP: 52.59.103.54`);
});
