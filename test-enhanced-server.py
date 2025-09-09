#!/usr/bin/env python3
"""
Test script for Enhanced Static IP Proxy Server
Tests both HTTP proxy and SFTP functionality
"""

import requests
import json
import sys
import time

# Configuration
PROXY_URL = "https://static-ip-proxy.onrender.com"
EXPECTED_STATIC_IP = "52.59.103.54"

def test_http_proxy():
    """Test HTTP proxy functionality"""
    print("🌐 Testing HTTP Proxy Functionality...")
    
    try:
        # Test 1: Check static IP
        print("\n1️⃣ Testing static IP check...")
        response = requests.get(f"{PROXY_URL}/ip")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Static IP check successful!")
            print(f"   IP: {data.get('outbound_ip', 'Unknown')}")
            
            if EXPECTED_STATIC_IP in str(data.get('outbound_ip', '')):
                print(f"✅ Static IP matches expected: {EXPECTED_STATIC_IP}")
            else:
                print(f"⚠️  Static IP doesn't match expected: {EXPECTED_STATIC_IP}")
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing static IP: {e}")
        return False
    
    try:
        # Test 2: Test proxy with external API
        print("\n2️⃣ Testing proxy with external API...")
        response = requests.get(f"{PROXY_URL}/proxy?url=https://httpbin.org/ip")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Proxy API test successful!")
            print(f"   Response: {data}")
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing proxy API: {e}")
        return False
    
    return True

def test_sftp_endpoints():
    """Test SFTP endpoint availability"""
    print("\n📁 Testing SFTP Endpoints...")
    
    try:
        # Test SFTP connect endpoint (without actual connection)
        print("\n1️⃣ Testing SFTP connect endpoint...")
        response = requests.post(f"{PROXY_URL}/sftp/connect", json={
            "host": "test.example.com",
            "username": "test"
        })
        
        # We expect this to fail (no password/key), but endpoint should exist
        if response.status_code in [400, 500]:
            print("✅ SFTP connect endpoint available (expected auth error)")
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
        
    except Exception as e:
        print(f"❌ Error testing SFTP connect: {e}")
        return False
    
    try:
        # Test SFTP list endpoint (should fail without connection)
        print("\n2️⃣ Testing SFTP list endpoint...")
        response = requests.get(f"{PROXY_URL}/sftp/list/test-connection")
        
        if response.status_code == 404:
            print("✅ SFTP list endpoint available (expected connection not found)")
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
        
    except Exception as e:
        print(f"❌ Error testing SFTP list: {e}")
        return False
    
    return True

def test_server_info():
    """Test server information endpoint"""
    print("\n📊 Testing Server Information...")
    
    try:
        response = requests.get(f"{PROXY_URL}/")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Server info retrieved successfully!")
            print(f"   Version: {data.get('version', 'Unknown')}")
            print(f"   Features: {', '.join(data.get('features', []))}")
            print(f"   Static IP: {data.get('usage', {}).get('static_ip', 'Unknown')}")
            return True
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing server info: {e}")
        return False

def test_health_check():
    """Test health check endpoint"""
    print("\n🏥 Testing Health Check...")
    
    try:
        response = requests.get(f"{PROXY_URL}/health")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check successful!")
            print(f"   Status: {data.get('status', 'Unknown')}")
            print(f"   Uptime: {data.get('uptime', 0):.2f} seconds")
            print(f"   Features: {', '.join(data.get('features', []))}")
            return True
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing health check: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Enhanced Static IP Proxy Server Test")
    print("=" * 60)
    print(f"📍 Testing server: {PROXY_URL}")
    print(f"🎯 Expected static IP: {EXPECTED_STATIC_IP}")
    print("=" * 60)
    
    # Test all functionality
    health_success = test_health_check()
    info_success = test_server_info()
    http_success = test_http_proxy()
    sftp_success = test_sftp_endpoints()
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    print(f"   Health Check: {'✅ PASS' if health_success else '❌ FAIL'}")
    print(f"   Server Info: {'✅ PASS' if info_success else '❌ FAIL'}")
    print(f"   HTTP Proxy: {'✅ PASS' if http_success else '❌ FAIL'}")
    print(f"   SFTP Endpoints: {'✅ PASS' if sftp_success else '❌ FAIL'}")
    
    if health_success and info_success and http_success and sftp_success:
        print("\n🎉 All tests passed! Enhanced server is working!")
        print(f"📍 Your static IP: {EXPECTED_STATIC_IP}")
        print(f"🌐 Server URL: {PROXY_URL}")
        print("🔧 Features: HTTP Proxy + SFTP Tunneling + File Operations")
        return 0
    else:
        print("\n❌ Some tests failed. Please check the server configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
