// Example usage of the Static IP Proxy Server
// This file demonstrates how to integrate the proxy with your Netlify application

// Example 1: Basic fetch request through proxy
async function basicProxyRequest() {
  const proxyUrl = 'https://your-proxy-server.onrender.com';
  const targetUrl = 'https://jsonplaceholder.typicode.com/posts/1';
  
  try {
    const response = await fetch(`${proxyUrl}/proxy?url=${encodeURIComponent(targetUrl)}`);
    const data = await response.json();
    console.log('Proxy response:', data);
    return data;
  } catch (error) {
    console.error('Proxy request failed:', error);
    throw error;
  }
}

// Example 2: POST request with data
async function postThroughProxy() {
  const proxyUrl = 'https://your-proxy-server.onrender.com';
  const targetUrl = 'https://jsonplaceholder.typicode.com/posts';
  
  const postData = {
    title: 'My Post',
    body: 'This is posted through the proxy',
    userId: 1
  };
  
  try {
    const response = await fetch(`${proxyUrl}/proxy?url=${encodeURIComponent(targetUrl)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });
    
    const result = await response.json();
    console.log('POST response:', result);
    return result;
  } catch (error) {
    console.error('POST request failed:', error);
    throw error;
  }
}

// Example 3: Netlify Function integration
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    const { targetUrl, method = 'GET', body } = JSON.parse(event.body || '{}');
    
    if (!targetUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'targetUrl is required' })
      };
    }
    
    const proxyUrl = process.env.PROXY_SERVER_URL || 'https://your-proxy-server.onrender.com';
    const response = await fetch(`${proxyUrl}/proxy?url=${encodeURIComponent(targetUrl)}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Example 4: React component usage
const ProxyComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const proxyUrl = 'https://your-proxy-server.onrender.com';
      const targetUrl = 'https://api.example.com/data';
      
      const response = await fetch(`${proxyUrl}/proxy?url=${encodeURIComponent(targetUrl)}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};

// Example 5: Check proxy server health and IP
async function checkProxyHealth() {
  const proxyUrl = 'https://your-proxy-server.onrender.com';
  
  try {
    // Check health
    const healthResponse = await fetch(`${proxyUrl}/health`);
    const health = await healthResponse.json();
    console.log('Proxy health:', health);
    
    // Check IP
    const ipResponse = await fetch(`${proxyUrl}/ip`);
    const ipInfo = await ipResponse.json();
    console.log('Proxy IP:', ipInfo);
    
    return { health, ipInfo };
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

// Example 6: Error handling wrapper
class ProxyClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  
  async request(targetUrl, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/proxy?url=${encodeURIComponent(targetUrl)}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Proxy request failed:', error);
      throw new Error(`Proxy request failed: ${error.message}`);
    }
  }
  
  async get(url) {
    return this.request(url, { method: 'GET' });
  }
  
  async post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  async delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

// Usage example
const proxy = new ProxyClient('https://your-proxy-server.onrender.com');

// Use the proxy client
async function exampleUsage() {
  try {
    const data = await proxy.get('https://jsonplaceholder.typicode.com/posts/1');
    console.log('Data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    basicProxyRequest,
    postThroughProxy,
    checkProxyHealth,
    ProxyClient
  };
}
