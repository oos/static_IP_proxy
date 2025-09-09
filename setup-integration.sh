#!/bin/bash
# Setup script for Foodbuy-procedural static IP proxy integration
# This script helps you add the integration files to your repository

echo "🚀 Setting up Foodbuy-procedural Static IP Proxy Integration"
echo "=============================================================="

# Check if we're in the right directory
if [ ! -f "foodbuy-integration-package/README.md" ]; then
    echo "❌ Error: Please run this script from the static_IP_proxy directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

echo "📁 Integration package found!"
echo ""

# Instructions for manual setup
echo "📋 Manual Setup Instructions:"
echo "=============================="
echo ""
echo "1. Copy these files to your Foodbuy-procedural repository:"
echo "   - foodbuy-integration-package/netlify/functions/proxy.js"
echo "   - foodbuy-integration-package/package.json"
echo "   - foodbuy-integration-package/netlify.toml"
echo "   - foodbuy-integration-package/proxy-client.js"
echo "   - foodbuy-integration-package/test-proxy.py"
echo "   - foodbuy-integration-package/test-proxy.js"
echo ""
echo "2. In your Foodbuy-procedural repository, run:"
echo "   git add ."
echo "   git commit -m 'Add static IP proxy integration'"
echo "   git push origin main"
echo ""
echo "3. Netlify will automatically redeploy with the new functions"
echo ""
echo "4. Test the integration:"
echo "   python test-proxy.py"
echo "   # or"
echo "   node test-proxy.js"
echo ""

# Show the files that need to be copied
echo "📂 Files to copy:"
echo "=================="
find foodbuy-integration-package -type f -name "*.js" -o -name "*.json" -o -name "*.toml" -o -name "*.py" | while read file; do
    echo "   $file"
done

echo ""
echo "🎯 After setup, your static IP will be: 52.59.103.54"
echo "🌐 Your Netlify site: https://order-integration.netlify.app"
echo "🔗 Proxy function: https://order-integration.netlify.app/.netlify/functions/proxy"
echo ""
echo "✅ Ready to integrate!"
