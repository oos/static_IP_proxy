#!/usr/bin/env python3
"""
Script to update Foodbuy-procedural Python scripts to use Render instead of Netlify
This script updates the proxy URLs and removes Netlify dependencies
"""

import os
import re
import sys
from pathlib import Path

# Configuration
RENDER_URL = "https://static-ip-proxy.onrender.com"
NETLIFY_URL = "https://order-integration.netlify.app"

def update_file(file_path):
    """Update a single file to use Render instead of Netlify"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Replace Netlify URLs with Render URLs
        content = content.replace(NETLIFY_URL, RENDER_URL)
        content = content.replace("order-integration.netlify.app", "static-ip-proxy.onrender.com")
        
        # Update proxy function calls
        content = content.replace("/.netlify/functions/proxy", "/proxy")
        
        # Update test scripts to use Render
        content = content.replace("NETLIFY_SITE_URL", "RENDER_SITE_URL")
        content = content.replace("PROXY_FUNCTION_URL", "PROXY_URL")
        
        # Update comments
        content = content.replace("Netlify function", "Render server")
        content = content.replace("Netlify proxy", "Render proxy")
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Updated: {file_path}")
            return True
        else:
            print(f"⏭️  No changes needed: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error updating {file_path}: {e}")
        return False

def update_foodbuy_scripts():
    """Update all Python scripts in Foodbuy-procedural project"""
    foodbuy_path = Path("/Users/oos/RB/Foodbuy-procedural")
    
    if not foodbuy_path.exists():
        print(f"❌ Foodbuy-procedural directory not found: {foodbuy_path}")
        return False
    
    print(f"🔄 Updating Python scripts in: {foodbuy_path}")
    print(f"📍 Changing from: {NETLIFY_URL}")
    print(f"📍 Changing to: {RENDER_URL}")
    print("=" * 60)
    
    updated_files = []
    
    # Find all Python files
    python_files = list(foodbuy_path.glob("**/*.py"))
    
    for py_file in python_files:
        if update_file(py_file):
            updated_files.append(py_file)
    
    print("\n" + "=" * 60)
    print(f"📊 Update Summary:")
    print(f"   Files processed: {len(python_files)}")
    print(f"   Files updated: {len(updated_files)}")
    
    if updated_files:
        print(f"\n✅ Updated files:")
        for file in updated_files:
            print(f"   - {file.relative_to(foodbuy_path)}")
    
    return len(updated_files) > 0

def create_render_client():
    """Create a Render client library for easy integration"""
    foodbuy_path = Path("/Users/oos/RB/Foodbuy-procedural")
    client_file = foodbuy_path / "render_client.py"
    
    client_code = '''#!/usr/bin/env python3
"""
Render Static IP Proxy Client
Easy-to-use client for Render static IP proxy server
"""

import requests
import json
from typing import Optional, Dict, Any

class RenderProxyClient:
    """Client for Render static IP proxy server"""
    
    def __init__(self, base_url: str = "https://static-ip-proxy.onrender.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'Render-Proxy-Client/1.0'
        })
    
    def get_static_ip(self) -> Optional[str]:
        """Get the current static IP address"""
        try:
            response = self.session.get(f"{self.base_url}/ip")
            response.raise_for_status()
            data = response.json()
            return data.get('outbound_ip')
        except Exception as e:
            print(f"❌ Error getting static IP: {e}")
            return None
    
    def proxy_request(self, url: str, method: str = 'GET', **kwargs) -> Optional[Dict[Any, Any]]:
        """Make a request through the static IP proxy"""
        try:
            response = self.session.request(
                method, 
                f"{self.base_url}/proxy?url={url}",
                **kwargs
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"❌ Proxy request failed: {e}")
            return None
    
    def get(self, url: str, **kwargs) -> Optional[Dict[Any, Any]]:
        """GET request through proxy"""
        return self.proxy_request(url, 'GET', **kwargs)
    
    def post(self, url: str, **kwargs) -> Optional[Dict[Any, Any]]:
        """POST request through proxy"""
        return self.proxy_request(url, 'POST', **kwargs)
    
    def put(self, url: str, **kwargs) -> Optional[Dict[Any, Any]]:
        """PUT request through proxy"""
        return self.proxy_request(url, 'PUT', **kwargs)
    
    def delete(self, url: str, **kwargs) -> Optional[Dict[Any, Any]]:
        """DELETE request through proxy"""
        return self.proxy_request(url, 'DELETE', **kwargs)

# Example usage
if __name__ == "__main__":
    client = RenderProxyClient()
    
    # Get static IP
    ip = client.get_static_ip()
    print(f"Static IP: {ip}")
    
    # Make a proxy request
    data = client.get("https://httpbin.org/ip")
    if data:
        print(f"Proxy response: {data}")
'''
    
    try:
        with open(client_file, 'w', encoding='utf-8') as f:
            f.write(client_code)
        print(f"✅ Created Render client: {client_file}")
        return True
    except Exception as e:
        print(f"❌ Error creating Render client: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Updating Foodbuy-procedural to use Render instead of Netlify")
    print("=" * 70)
    
    # Update Python scripts
    scripts_updated = update_foodbuy_scripts()
    
    # Create Render client
    client_created = create_render_client()
    
    print("\n" + "=" * 70)
    print("📋 Next Steps:")
    print("1. Review the updated files")
    print("2. Test the updated scripts")
    print("3. Remove Netlify deployment if no longer needed")
    print("4. Update any hardcoded URLs in your code")
    
    if scripts_updated or client_created:
        print("\n✅ Update completed successfully!")
        return 0
    else:
        print("\n⚠️  No files were updated.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
