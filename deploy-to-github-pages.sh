#!/bin/bash
# Deploy UOR MCP Server to GitHub Pages
# This script builds and deploys the MCP server to GitHub Pages

# Set colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}UOR MCP Server - GitHub Pages Deployment${NC}"
echo -e "---------------------------------------"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated with gh
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You need to authenticate with GitHub CLI.${NC}"
    gh auth login
fi

# Get the current repository name
REPO_NAME=$(basename -s .git $(git config --get remote.origin.url))
if [ -z "$REPO_NAME" ]; then
    echo -e "${YELLOW}Not a git repository or remote not set.${NC}"
    echo "Using 'mcp' as the repository name."
    REPO_NAME="mcp"
fi

# Get the user's GitHub username
GITHUB_USER=$(gh api user | jq -r '.login')
if [ -z "$GITHUB_USER" ]; then
    echo -e "${RED}Failed to get GitHub username.${NC}"
    exit 1
fi

# Build the project
echo -e "\n${GREEN}Building project...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed.${NC}"
    exit 1
fi

# Copy client files to dist/public
echo -e "\n${GREEN}Copying client files...${NC}"
mkdir -p dist/public
cp -r public/* dist/public/

# Create GitHub OAuth config
echo -e "\n${YELLOW}Setting up GitHub OAuth configuration...${NC}"
echo "You need to create a GitHub OAuth application at https://github.com/settings/developers"
echo "Use the following callback URL: https://$GITHUB_USER.github.io/$REPO_NAME/auth-callback.html"

# Ask for GitHub OAuth Client ID
read -p "Enter your GitHub OAuth Client ID (or leave empty to configure later): " GITHUB_CLIENT_ID

# Create a config file for deployment
CONFIG_FILE="dist/public/deployment-config.js"
echo "// Deployment-specific configuration for UOR MCP Server" > $CONFIG_FILE
echo "window.DEPLOYMENT_CONFIG = {" >> $CONFIG_FILE
echo "  githubUser: \"$GITHUB_USER\"," >> $CONFIG_FILE

if [ ! -z "$GITHUB_CLIENT_ID" ]; then
    echo "  githubClientId: \"$GITHUB_CLIENT_ID\"," >> $CONFIG_FILE
fi

# Ask for token exchange proxy URL
echo -e "\n${YELLOW}Token Exchange Proxy Setup${NC}"
echo "You need a token exchange proxy to handle GitHub OAuth securely."
echo "For more information, see: https://github.com/$GITHUB_USER/$REPO_NAME/blob/main/docs/token-exchange-proxy.md"
read -p "Enter your token exchange proxy URL (or leave empty to configure later): " TOKEN_PROXY

if [ ! -z "$TOKEN_PROXY" ]; then
    echo "  tokenExchangeProxy: \"$TOKEN_PROXY\"," >> $CONFIG_FILE
fi

echo "  deployedAt: \"$(date -u +'%Y-%m-%dT%H:%M:%SZ')\"" >> $CONFIG_FILE
echo "};" >> $CONFIG_FILE
echo "" >> $CONFIG_FILE
echo "// Apply the deployment configuration" >> $CONFIG_FILE
echo "document.addEventListener('DOMContentLoaded', () => {" >> $CONFIG_FILE
echo "  const config = window.MCPConfig.getConfig();" >> $CONFIG_FILE
echo "  if (window.DEPLOYMENT_CONFIG.githubClientId) {" >> $CONFIG_FILE
echo "    config.githubOAuth.clientId = window.DEPLOYMENT_CONFIG.githubClientId;" >> $CONFIG_FILE
echo "  }" >> $CONFIG_FILE
echo "  if (window.DEPLOYMENT_CONFIG.tokenExchangeProxy) {" >> $CONFIG_FILE
echo "    config.githubOAuth.tokenExchangeProxy = window.DEPLOYMENT_CONFIG.tokenExchangeProxy;" >> $CONFIG_FILE
echo "  }" >> $CONFIG_FILE
echo "  window.MCPConfig.saveConfig(config);" >> $CONFIG_FILE
echo "});" >> $CONFIG_FILE

# Create a custom 404 page that redirects to index.html
echo -e "\n${GREEN}Creating 404 page for SPA support...${NC}"
cat > dist/public/404.html << EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    // Redirect to the home page with the path as a query parameter
    const path = window.location.pathname;
    window.location.href = '/?path=' + encodeURIComponent(path);
  </script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>
EOF

# Deploy to GitHub Pages
echo -e "\n${GREEN}Deploying to GitHub Pages...${NC}"
cd dist/public
touch .nojekyll # Prevent Jekyll processing

# Deploy using gh-pages branch
echo -e "\n${BLUE}Deploying to gh-pages branch...${NC}"
git init
git add .
git config user.name "GitHub Actions"
git config user.email "actions@github.com"
git commit -m "Deploy UOR MCP Server to GitHub Pages"
git branch -M gh-pages
git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git

# Push to gh-pages branch
echo -e "\n${YELLOW}Pushing to gh-pages branch...${NC}"
git push -f origin gh-pages

echo -e "\n${GREEN}Deployment complete!${NC}"
echo -e "Your UOR MCP Server is now available at: ${BLUE}https://$GITHUB_USER.github.io/$REPO_NAME/${NC}"

if [ -z "$GITHUB_CLIENT_ID" ] || [ -z "$TOKEN_PROXY" ]; then
    echo -e "\n${YELLOW}Note:${NC} You did not provide all configuration options."
    echo "You can configure the application by visiting:"
    echo -e "${BLUE}https://$GITHUB_USER.github.io/$REPO_NAME/?github_client_id=YOUR_CLIENT_ID&token_exchange_proxy=YOUR_PROXY_URL${NC}"
fi

echo -e "\n${BLUE}For more information on setting up a token exchange proxy, see:${NC}"
echo -e "${BLUE}https://github.com/$GITHUB_USER/$REPO_NAME/blob/main/docs/token-exchange-proxy.md${NC}"

# Return to the original directory
cd ../..