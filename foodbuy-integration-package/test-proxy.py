#!/usr/bin/env python3
"""
Test script for Foodbuy-procedural static IP proxy integration
This script tests the Netlify function proxy integration
"""

import requests
import json
import sys

# Configuration
NETLIFY_SITE_URL = "https://order-integration.netlify.app"
PROXY_FUNCTION_URL = f"{NETLIFY_SITE_URL}/.netlify/functions/proxy"
EXPECTED_STATIC_IP = "52.59.103.54"

def test_proxy_function():
    """Test the Netlify proxy function"""
    print("🧪 Testing Netlify Proxy Function...")
    print(f"📍 Testing URL: {PROXY_FUNCTION_URL}")
    
    try:
        # Test 1: Check static IP
        print("\n1️⃣ Testing static IP check...")
        response = requests.post(PROXY_FUNCTION_URL, json={
            "targetUrl": "https://httpbin.org/ip"
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                ip_info = data['data']
                print(f"✅ Static IP check successful!")
                print(f"   IP: {ip_info.get('origin', 'Unknown')}")
                
                # Check if IP matches expected
                if EXPECTED_STATIC_IP in str(ip_info.get('origin', '')):
                    print(f"✅ Static IP matches expected: {EXPECTED_STATIC_IP}")
                else:
                    print(f"⚠️  Static IP doesn't match expected: {EXPECTED_STATIC_IP}")
            else:
                print(f"❌ Proxy request failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing proxy function: {e}")
        return False
    
    try:
        # Test 2: Test with a simple API
        print("\n2️⃣ Testing with JSONPlaceholder API...")
        response = requests.post(PROXY_FUNCTION_URL, json={
            "targetUrl": "https://jsonplaceholder.typicode.com/posts/1"
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                post_data = data['data']
                print(f"✅ API test successful!")
                print(f"   Post ID: {post_data.get('id', 'Unknown')}")
                print(f"   Title: {post_data.get('title', 'Unknown')[:50]}...")
            else:
                print(f"❌ API test failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing API: {e}")
        return False
    
    return True

def test_direct_proxy():
    """Test direct connection to Render proxy"""
    print("\n🌐 Testing Direct Render Proxy...")
    
    try:
        response = requests.get("https://static-ip-proxy.onrender.com/ip")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Direct proxy test successful!")
            print(f"   IP: {data.get('outbound_ip', 'Unknown')}")
            return True
        else:
            print(f"❌ Direct proxy test failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing direct proxy: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Foodbuy-procedural Static IP Proxy Integration Test")
    print("=" * 60)
    
    # Test direct proxy first
    direct_success = test_direct_proxy()
    
    # Test Netlify function
    function_success = test_proxy_function()
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    print(f"   Direct Proxy: {'✅ PASS' if direct_success else '❌ FAIL'}")
    print(f"   Netlify Function: {'✅ PASS' if function_success else '❌ FAIL'}")
    
    if direct_success and function_success:
        print("\n🎉 All tests passed! Your static IP proxy integration is working!")
        print(f"📍 Your static IP: {EXPECTED_STATIC_IP}")
        print(f"🌐 Netlify site: {NETLIFY_SITE_URL}")
        print(f"🔗 Proxy function: {PROXY_FUNCTION_URL}")
        return 0
    else:
        print("\n❌ Some tests failed. Please check the configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
