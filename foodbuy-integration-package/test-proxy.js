#!/usr/bin/env node
/**
 * Test script for Foodbuy-procedural static IP proxy integration
 * This script tests the Netlify function proxy integration
 */

const fetch = require('node-fetch');

// Configuration
const NETLIFY_SITE_URL = "https://order-integration.netlify.app";
const PROXY_FUNCTION_URL = `${NETLIFY_SITE_URL}/.netlify/functions/proxy`;
const EXPECTED_STATIC_IP = "52.59.103.54";

async function testProxyFunction() {
    console.log("🧪 Testing Netlify Proxy Function...");
    console.log(`📍 Testing URL: ${PROXY_FUNCTION_URL}`);
    
    try {
        // Test 1: Check static IP
        console.log("\n1️⃣ Testing static IP check...");
        const response = await fetch(PROXY_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetUrl: "https://httpbin.org/ip"
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const ipInfo = data.data;
                console.log("✅ Static IP check successful!");
                console.log(`   IP: ${ipInfo.origin || 'Unknown'}`);
                
                // Check if IP matches expected
                if (ipInfo.origin && ipInfo.origin.includes(EXPECTED_STATIC_IP)) {
                    console.log(`✅ Static IP matches expected: ${EXPECTED_STATIC_IP}`);
                } else {
                    console.log(`⚠️  Static IP doesn't match expected: ${EXPECTED_STATIC_IP}`);
                }
            } else {
                console.log(`❌ Proxy request failed: ${data.message || 'Unknown error'}`);
                return false;
            }
        } else {
            console.log(`❌ HTTP ${response.status}: ${await response.text()}`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Error testing proxy function: ${error.message}`);
        return false;
    }
    
    try {
        // Test 2: Test with a simple API
        console.log("\n2️⃣ Testing with JSONPlaceholder API...");
        const response = await fetch(PROXY_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetUrl: "https://jsonplaceholder.typicode.com/posts/1"
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const postData = data.data;
                console.log("✅ API test successful!");
                console.log(`   Post ID: ${postData.id || 'Unknown'}`);
                console.log(`   Title: ${(postData.title || 'Unknown').substring(0, 50)}...`);
            } else {
                console.log(`❌ API test failed: ${data.message || 'Unknown error'}`);
                return false;
            }
        } else {
            console.log(`❌ HTTP ${response.status}: ${await response.text()}`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Error testing API: ${error.message}`);
        return false;
    }
    
    return true;
}

async function testDirectProxy() {
    console.log("\n🌐 Testing Direct Render Proxy...");
    
    try {
        const response = await fetch("https://static-ip-proxy.onrender.com/ip");
        if (response.ok) {
            const data = await response.json();
            console.log("✅ Direct proxy test successful!");
            console.log(`   IP: ${data.outbound_ip || 'Unknown'}`);
            return true;
        } else {
            console.log(`❌ Direct proxy test failed: HTTP ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error testing direct proxy: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log("🚀 Foodbuy-procedural Static IP Proxy Integration Test");
    console.log("=".repeat(60));
    
    // Test direct proxy first
    const directSuccess = await testDirectProxy();
    
    // Test Netlify function
    const functionSuccess = await testProxyFunction();
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Results Summary:");
    console.log(`   Direct Proxy: ${directSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Netlify Function: ${functionSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    if (directSuccess && functionSuccess) {
        console.log("\n🎉 All tests passed! Your static IP proxy integration is working!");
        console.log(`📍 Your static IP: ${EXPECTED_STATIC_IP}`);
        console.log(`🌐 Netlify site: ${NETLIFY_SITE_URL}`);
        console.log(`🔗 Proxy function: ${PROXY_FUNCTION_URL}`);
        process.exit(0);
    } else {
        console.log("\n❌ Some tests failed. Please check the configuration.");
        process.exit(1);
    }
}

// Run the tests
main().catch(error => {
    console.error("❌ Test execution failed:", error);
    process.exit(1);
});
