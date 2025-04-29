# Universal Object Reference (UOR) MCP Server

This is the GitHub Pages implementation of the UOR MCP Server, which provides a standardized Model Context Protocol (MCP) interface for the Universal Object Reference framework.

## Getting Started

To use this GitHub Pages application:

1. Configure the application by adding URL parameters:
   - `github_client_id`: Your GitHub OAuth application client ID
   - `token_exchange_proxy`: URL of your token exchange proxy (see below)
   - `default_namespace`: (Optional) Default UOR namespace

Example URL: `https://68113dd199a34737508b5211--uor-mcp.netlify.app/?github_client_id=your_client_id&token_exchange_proxy=https://your-proxy.netlify.app/.netlify/functions/token-exchange`

## GitHub Authentication

This application uses GitHub OAuth for authentication, which requires a server-side component to handle the token exchange securely. The server-side component keeps your OAuth client secret secure while allowing the static GitHub Pages application to authenticate users.

### How to Set Up GitHub Authentication

1. **Create a GitHub OAuth Application**:
   - Go to your GitHub account settings
   - Navigate to Developer Settings > OAuth Apps > New OAuth App
   - Set the Authorization callback URL to match your deployment, e.g., `https://68113dd199a34737508b5211--uor-mcp.netlify.app/auth-callback.html`
   - Note the Client ID and Client Secret

2. **Deploy a Token Exchange Proxy**:
   - The proxy is a small serverless function that securely stores your client secret
   - You can deploy it to platforms like Netlify, Vercel, or CloudFlare Workers
   - See the [token exchange proxy documentation](https://github.com/UOR-Foundation/mcp/blob/main/docs/token-exchange-proxy.md) for implementation details

3. **Configure the UOR MCP Client**:
   - Add your GitHub Client ID and token exchange proxy URL to the application URL as parameters
   - Or modify the configuration in `config.js` for your own deployment

### Security Considerations

- The client secret is never exposed in client-side code
- The token exchange proxy should have proper CORS settings to only allow requests from your GitHub Pages domain
- All communication should be over HTTPS
- The application implements CSRF protection using the state parameter

## Offline Mode

For local development and testing, the application will use a simulated authentication mode if running on localhost. This allows you to test the application without setting up a token exchange proxy.

To run in development mode:
```
npm run dev:client
```

## Features

- Authentication with GitHub OAuth
- Access to UOR objects through the MCP protocol
- Support for GitHub-based storage of UOR objects
- Client-side management of authentication state
- Cross-tab synchronization of auth state
- Automatic token refresh

## MCP Protocol

This implementation supports the MCP Protocol v2025-03-26, with the following methods:
- `initialize`: Establishes protocol version and capabilities
- `tools/list`: Lists available UOR tools
- `resources/list`: Lists available UOR resources
- `tools/call`: Executes UOR operations

## Related Documentation

- [UOR Framework Documentation](https://github.com/UOR-Foundation/docs)
- [MCP Protocol Specification](https://github.com/UOR-Foundation/mcp/blob/main/docs/protocol.md)
- [Token Exchange Proxy Setup](https://github.com/UOR-Foundation/mcp/blob/main/docs/token-exchange-proxy.md)
