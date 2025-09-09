# Static IP Proxy Server

A lightweight proxy server designed to provide a static outbound IP address for applications deployed on Netlify. This server runs on Render and acts as a proxy to route your application's requests through a consistent IP address.

## Features

- 🚀 **Lightweight**: Minimal dependencies and fast performance
- 🌐 **Static IP**: Consistent outbound IP address for all requests
- 🔒 **Secure**: Built-in CORS support and security headers
- 📡 **Health Monitoring**: Built-in health check and IP verification endpoints
- ⚡ **Easy Integration**: Simple API for Netlify applications
- 🛡️ **Error Handling**: Comprehensive error handling and logging

## Quick Start

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd static_IP_proxy
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Deploy to Render

1. Push your code to GitHub
2. Connect your repository to Render
3. Render will automatically detect the `render.yaml` configuration
4. Deploy and get your static IP proxy URL

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and uptime information.

### IP Check
```
GET /ip
```
Returns the outbound IP address of the proxy server.

### Proxy Request
```
GET /proxy?url=<target_url>
POST /proxy?url=<target_url>
PUT /proxy?url=<target_url>
DELETE /proxy?url=<target_url>
```
Proxies requests to the specified target URL.

## Usage Examples

### Basic Proxy Request
```javascript
// In your Netlify function or client-side code
const proxyUrl = 'https://your-proxy-server.onrender.com';
const targetUrl = 'https://api.example.com/data';

const response = await fetch(`${proxyUrl}/proxy?url=${encodeURIComponent(targetUrl)}`);
const data = await response.json();
```

### Using with Netlify Functions
```javascript
// netlify/functions/api-proxy.js
exports.handler = async (event, context) => {
  const { targetUrl } = JSON.parse(event.body);
  const proxyUrl = process.env.PROXY_SERVER_URL;
  
  try {
    const response = await fetch(`${proxyUrl}/proxy?url=${encodeURIComponent(targetUrl)}`);
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### Client-Side Integration
```javascript
// In your React/Vue/Angular application
class ProxyService {
  constructor(proxyBaseUrl) {
    this.proxyBaseUrl = proxyBaseUrl;
  }
  
  async makeRequest(targetUrl, options = {}) {
    const proxyUrl = `${this.proxyBaseUrl}/proxy?url=${encodeURIComponent(targetUrl)}`;
    
    return fetch(proxyUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }
}

// Usage
const proxy = new ProxyService('https://your-proxy-server.onrender.com');
const response = await proxy.makeRequest('https://api.example.com/data');
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |

## CORS Configuration

The server is pre-configured to accept requests from:
- `*.netlify.app` domains
- `*.netlify.com` domains
- `localhost:3000` (development)
- `localhost:8888` (Netlify dev server)

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Configured for Netlify applications
- **Input Validation**: URL validation and sanitization
- **Error Handling**: Comprehensive error responses
- **Rate Limiting**: Built-in timeout protection

## Monitoring

### Health Check
Monitor your proxy server health:
```bash
curl https://your-proxy-server.onrender.com/health
```

### IP Verification
Verify the static IP address:
```bash
curl https://your-proxy-server.onrender.com/ip
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your domain is included in the CORS configuration
2. **Timeout Errors**: Check if the target URL is accessible and responding
3. **Invalid URL**: Ensure the target URL is properly encoded

### Debug Mode
Set `NODE_ENV=development` to see detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation
