# Model Context Protocol (MCP) - UOR Implementation

[![CI/CD Pipeline](https://github.com/UOR-Foundation/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/UOR-Foundation/mcp/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%20%7C%2020-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

The Model Context Protocol (MCP) implementation for the Universal Object Reference (UOR) Framework provides a standardized way for LLMs to access and manipulate UOR data. This implementation uses GitHub for data storage and version control, enabling a decentralized approach to UOR data management.

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/UOR-Foundation/mcp.git
cd mcp

# Install dependencies
npm ci

# Build the project
npm run build

# Run tests
npm test
```

### Development

```bash
# Start development server
npm run dev

# Start client in development mode
npm run dev:client

# Access the client at http://localhost:8080
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/core/tests/uor-coherence.test.ts
```

### Building

```bash
# Build for production
npm run build

# Build client for production
npm run build:client
```

## Architecture

This implementation follows the core UOR architecture, built around the trilateral coherence relationship between:

1. **Objects**: The entities being represented
2. **Representations**: Base-independent canonical forms of objects
3. **Observer Frames**: Perspectives from which objects are viewed

The MCP server inherits from the UOR abstract TypeScript class, ensuring that all UOR invariant properties are maintained while providing an interface compatible with the MCP specification.

## GitHub Integration

### Server Hosting
- Hosted via GitHub Pages from `github.com/UOR-Foundation/mcp`
- Requires no dedicated server infrastructure
- Serves the MCP protocol endpoint via HTTPS
- Uses branch-specific deployments for version control

### User Data Management
- Each user can authenticate with GitHub credentials
- Upon authentication, creates/accesses a personal `github.com/<username>/uordb` repository
- All user data is stored in their personal repository
- Repository structure follows the UOR schema organization with directories for: concepts, resources, topics, and predicates

### Data Operations
- **Read**: Fetches data via GitHub's raw content API (`https://raw.githubusercontent.com/<username>/uordb/main/...`)
- **Write**: Commits changes to the user's `uordb` repository using GitHub API
- All operations maintain the UOR base-independent canonical representation
- Changes are versioned through Git commit history with metadata that maintains UOR coherence

## Namespace Resolution

- Each user's data exists in their own GitHub namespace (`<username>/uordb`)
- Users can create resolver records in their namespace that point to other namespaces
- Resolver records are stored in a standard format at `<username>/uordb/resolvers/`
- The MCP client can traverse these resolver records to query across namespaces
- Creates a decentralized network of UOR content across GitHub repositories
- Circular references are detected and handled appropriately

## Protocol Implementation

The MCP implementation supports the standard MCP protocol features:

### Resources
- Provides access to UOR objects through standardized resource URIs
- Resources include concepts, topics, predicates, and other information resources
- All resources maintain canonical, base-independent representation
- Resource URIs follow the pattern: `uor://<namespace>/<type>/<id>`
- Supports HTTP transports mapped to GitHub raw content URLs

### Tools
- Supports CRUD operations on UOR objects
- Provides querying capabilities across namespaces
- Enables relationship traversal using predicate connections
- Implements standardized MCP tool interfaces for UOR operations
- Tool calls are authenticated against GitHub credentials

### Observer Frames
- Maintains consistent representation across different observer frames
- Supports transformation between frames while preserving essential information
- Implements frame-specific views while maintaining the invariant representation
- Frame transformations are implemented through TypeScript transform functions

## UOR Core Features

This implementation provides access to the UOR core features:

### Prime Decomposition
- Objects are factorized into their irreducible components
- Factorization is unique and observer-independent
- Implemented using the UOR abstract class methods for decomposition
- Decomposition is cached for performance but recalculated when objects change

### Canonical Representation
- Each object has a unique, basis-independent representation
- Representations maintain coherence across transformations
- JSON serialization maintains the canonical structure
- Implements UOR schema validation on all representations

### Trilateral Coherence
- Consistency is maintained between object, representation, and observer
- Coherence measures quantify representational integrity
- Coherence is verified during all write operations
- Leverages the UOR kernel invariants inherited from the abstract class

## Data Types and Schema Support

- Supports all standard JSON Schema data types
- Extends schema support beyond schema.org to custom domain schemas
- Multimedia content uses chunked representation for efficient storage
- All schemas conform to the UOR base-independent representation
- Large artifacts use the Artifact schema for chunked storage

## Security and Privacy

- Authentication is handled via GitHub's OAuth system
- Users maintain full control over their personal repositories
- Cross-namespace queries only access publicly available data or repositories where the user has explicit access
- Rate limiting follows GitHub API limits
- OAuth scopes are limited to the specific repositories needed

## GitHub Pages Deployment

The easiest way to use the MCP server is through our GitHub Pages deployment:

1. Visit [https://UOR-Foundation.github.io/mcp/](https://UOR-Foundation.github.io/mcp/)
2. Configure the application with your GitHub Client ID and Token Exchange Proxy
3. Authenticate with GitHub to access your UOR data
4. Start using the MCP protocol with your LLM applications

### Creating Your Own Deployment

To deploy your own instance:

1. Fork this repository
2. Create a GitHub OAuth application in your [GitHub Developer Settings](https://github.com/settings/developers)
   - Set the Authorization Callback URL to `https://your-username.github.io/mcp/auth-callback.html`
3. Create a token exchange proxy (see [Token Exchange Proxy Guide](docs/token-exchange-proxy.md))
4. Run the deployment script: `./deploy-to-github-pages.sh`
5. Access your deployment at `https://your-username.github.io/mcp/`

Alternatively, you can use URL parameters to configure your deployment:

```
https://your-username.github.io/mcp/?github_client_id=YOUR_CLIENT_ID&token_exchange_proxy=YOUR_PROXY_URL
```

### Usage with LLM Applications

To use this MCP server with LLM applications:

1. Configure your LLM app to use the MCP endpoint: `https://UOR-Foundation.github.io/mcp/mcp`
2. Authenticate your users with GitHub
3. Access UOR objects using the standard MCP protocol methods:
   - `initialize` - Set up the connection
   - `tools/list` - List available UOR tools
   - `resources/list` - List available UOR resources
   - `tools/call` - Execute UOR operations

## Repository Structure

```
/mcp
├── src/                # Source code
│   ├── core/           # UOR abstract classes implementation
│   ├── github/         # GitHub API integration
│   ├── mcp/            # MCP protocol implementation
│   ├── resolvers/      # Namespace resolution logic
│   ├── schema/         # JSON Schema validation
│   ├── content/        # Content management
│   ├── identity/       # User identity and profiles
│   ├── messaging/      # User messaging system
│   ├── pubsub/         # Publish/subscribe system
│   ├── decomposition/  # Prime decomposition algorithms
│   └── storage/        # Storage providers (GitHub, IPFS)
├── models/             # JSON Schema models
├── public/             # Static files for GitHub Pages
│   ├── components/     # UI components
│   └── config.js       # Client configuration
├── .github/            # GitHub Actions workflows
├── tests/              # Test suite
└── dist/               # Build output
```

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## Implementation Details

The MCP implementation is built as a TypeScript application that inherits from the UOR abstract class. It provides a faithful implementation of the Model Context Protocol while leveraging the mathematical foundation of the UOR Framework.

The server uses the following key technologies:
- TypeScript for type-safe implementation
- GitHub API for storage and authentication
- JSON Schema for validation
- MCP protocol for client/server communication
- Vite for optimized builds

All content is stored in its reversible, base-independent representation, ensuring information integrity regardless of how the data is accessed or viewed. This implementation maintains a clean separation between the UOR kernel (abstract class) and the MCP protocol layer, allowing for future protocol upgrades without affecting the core UOR functionality.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
