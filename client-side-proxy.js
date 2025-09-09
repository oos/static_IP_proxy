// Client-Side Proxy Service for Foodbuy-procedural
// Copy this to your Foodbuy-procedural project and import where needed

class ProxyService {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.proxyEndpoint = '/.netlify/functions/proxy';
  }

  /**
   * Make a request through the static IP proxy
   * @param {string} targetUrl - The URL to proxy to
   * @param {Object} options - Request options
   * @returns {Promise} - Response data
   */
  async makeRequest(targetUrl, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${this.proxyEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify({
          targetUrl,
          method: options.method || 'GET',
          body: options.body,
          headers: options.requestHeaders || {},
          timeout: options.timeout || 30000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Proxy request failed');
      }

      return result.data;
    } catch (error) {
      console.error('Proxy request failed:', error);
      throw new Error(`Proxy request failed: ${error.message}`);
    }
  }

  /**
   * GET request through proxy
   * @param {string} url - Target URL
   * @param {Object} options - Request options
   * @returns {Promise} - Response data
   */
  async get(url, options = {}) {
    return this.makeRequest(url, { ...options, method: 'GET' });
  }

  /**
   * POST request through proxy
   * @param {string} url - Target URL
   * @param {*} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise} - Response data
   */
  async post(url, data, options = {}) {
    return this.makeRequest(url, { 
      ...options, 
      method: 'POST', 
      body: data 
    });
  }

  /**
   * PUT request through proxy
   * @param {string} url - Target URL
   * @param {*} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise} - Response data
   */
  async put(url, data, options = {}) {
    return this.makeRequest(url, { 
      ...options, 
      method: 'PUT', 
      body: data 
    });
  }

  /**
   * DELETE request through proxy
   * @param {string} url - Target URL
   * @param {Object} options - Request options
   * @returns {Promise} - Response data
   */
  async delete(url, options = {}) {
    return this.makeRequest(url, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request through proxy
   * @param {string} url - Target URL
   * @param {*} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise} - Response data
   */
  async patch(url, data, options = {}) {
    return this.makeRequest(url, { 
      ...options, 
      method: 'PATCH', 
      body: data 
    });
  }

  /**
   * Check if proxy service is available
   * @returns {Promise<boolean>} - True if proxy is available
   */
  async isAvailable() {
    try {
      await this.get('https://httpbin.org/ip');
      return true;
    } catch (error) {
      console.warn('Proxy service not available:', error.message);
      return false;
    }
  }

  /**
   * Get the current static IP address
   * @returns {Promise<string>} - Static IP address
   */
  async getStaticIP() {
    try {
      const response = await this.get('https://httpbin.org/ip');
      return response.origin;
    } catch (error) {
      throw new Error(`Failed to get static IP: ${error.message}`);
    }
  }
}

// Create a default instance
const proxyService = new ProxyService();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS
  module.exports = { ProxyService, proxyService };
} else if (typeof window !== 'undefined') {
  // Browser global
  window.ProxyService = ProxyService;
  window.proxyService = proxyService;
}

// Example usage:
/*
// Basic usage
const data = await proxyService.get('https://api.example.com/data');

// With custom headers
const data = await proxyService.get('https://api.example.com/data', {
  requestHeaders: {
    'Authorization': 'Bearer your-token'
  }
});

// POST request
const result = await proxyService.post('https://api.example.com/create', {
  name: 'New Item',
  description: 'Item description'
});

// Check if proxy is available
if (await proxyService.isAvailable()) {
  console.log('Proxy service is ready');
  const staticIP = await proxyService.getStaticIP();
  console.log('Static IP:', staticIP);
} else {
  console.log('Proxy service not available, falling back to direct requests');
}
*/
