// Client-Side Proxy Service for Foodbuy-procedural
// Use this in your Python script or web interface

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
   */
  async get(url, options = {}) {
    return this.makeRequest(url, { ...options, method: 'GET' });
  }

  /**
   * POST request through proxy
   */
  async post(url, data, options = {}) {
    return this.makeRequest(url, { 
      ...options, 
      method: 'POST', 
      body: data 
    });
  }

  /**
   * Check if proxy service is available
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
  module.exports = { ProxyService, proxyService };
} else if (typeof window !== 'undefined') {
  window.ProxyService = ProxyService;
  window.proxyService = proxyService;
}

// Example usage:
/*
// Basic usage
const data = await proxyService.get('https://api.example.com/data');

// Check static IP
const staticIP = await proxyService.getStaticIP();
console.log('Static IP:', staticIP); // Will show: 52.59.103.54
*/
