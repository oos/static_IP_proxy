#!/bin/bash
# Script to copy integration files to Foodbuy-procedural repository
# Run this script from the static_IP_proxy directory

echo "🚀 Copying Static IP Proxy Integration to Foodbuy-procedural"
echo "============================================================="

# Check if we're in the right directory
if [ ! -f "foodbuy-integration-package/README.md" ]; then
    echo "❌ Error: Please run this script from the static_IP_proxy directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Get the path to Foodbuy-procedural repository
echo "📁 Please provide the path to your Foodbuy-procedural repository:"
echo "   Example: /Users/oos/RB/Foodbuy-procedural"
echo "   Or: ../Foodbuy-procedural"
echo ""
read -p "Path to Foodbuy-procedural: " FOODBUY_PATH

# Check if the path exists
if [ ! -d "$FOODBUY_PATH" ]; then
    echo "❌ Error: Directory '$FOODBUY_PATH' does not exist"
    echo "   Please check the path and try again"
    exit 1
fi

echo "✅ Found Foodbuy-procedural repository at: $FOODBUY_PATH"
echo ""

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p "$FOODBUY_PATH/netlify/functions"
echo "   Created: $FOODBUY_PATH/netlify/functions"

# Copy files
echo "📋 Copying files..."

# Copy proxy function
cp "foodbuy-integration-package/netlify/functions/proxy.js" "$FOODBUY_PATH/netlify/functions/"
echo "   ✅ Copied: netlify/functions/proxy.js"

# Copy package.json
cp "foodbuy-integration-package/package.json" "$FOODBUY_PATH/"
echo "   ✅ Copied: package.json"

# Copy netlify.toml
cp "foodbuy-integration-package/netlify.toml" "$FOODBUY_PATH/"
echo "   ✅ Copied: netlify.toml"

# Copy proxy client
cp "foodbuy-integration-package/proxy-client.js" "$FOODBUY_PATH/"
echo "   ✅ Copied: proxy-client.js"

# Copy test files
cp "foodbuy-integration-package/test-proxy.py" "$FOODBUY_PATH/"
echo "   ✅ Copied: test-proxy.py"

cp "foodbuy-integration-package/test-proxy.js" "$FOODBUY_PATH/"
echo "   ✅ Copied: test-proxy.js"

echo ""
echo "🎉 All files copied successfully!"
echo ""

# Show next steps
echo "📋 Next Steps:"
echo "=============="
echo "1. Navigate to your Foodbuy-procedural repository:"
echo "   cd $FOODBUY_PATH"
echo ""
echo "2. Add and commit the files:"
echo "   git add ."
echo "   git commit -m 'Add static IP proxy integration'"
echo "   git push origin main"
echo ""
echo "3. Wait for Netlify to redeploy (2-3 minutes)"
echo ""
echo "4. Test the integration:"
echo "   python test-proxy.py"
echo "   # or"
echo "   node test-proxy.js"
echo ""

# Ask if user wants to run git commands
read -p "🤔 Would you like me to run the git commands for you? (y/n): " RUN_GIT

if [ "$RUN_GIT" = "y" ] || [ "$RUN_GIT" = "Y" ]; then
    echo ""
    echo "🔄 Running git commands..."
    
    cd "$FOODBUY_PATH"
    
    echo "   Adding files to git..."
    git add .
    
    echo "   Committing changes..."
    git commit -m "Add static IP proxy integration"
    
    echo "   Pushing to GitHub..."
    git push origin main
    
    echo ""
    echo "✅ Git commands completed!"
    echo "   Netlify will automatically redeploy your site"
    echo "   Wait 2-3 minutes, then test with: python test-proxy.py"
else
    echo ""
    echo "📝 Manual git commands needed:"
    echo "   cd $FOODBUY_PATH"
    echo "   git add ."
    echo "   git commit -m 'Add static IP proxy integration'"
    echo "   git push origin main"
fi

echo ""
echo "🎯 After deployment, your static IP will be: 52.59.103.54"
echo "🌐 Your Netlify site: https://order-integration.netlify.app"
echo "🔗 Proxy function: https://order-integration.netlify.app/.netlify/functions/proxy"
echo ""
echo "✅ Setup complete!"
