# UOR-MCP: Model Context Protocol for Universal Object Reference

The Model Context Protocol (MCP) implementation for the Universal Object Reference (UOR) Framework provides a standardized way for LLMs and other clients to access and manipulate UOR data stored in GitHub repositories.

## Core Concepts

### Universal Object Reference (UOR)

UOR is a framework for referencing objects with a format `uor://namespace/type/id`. It provides a stable identifier across different storage backends and ensures trilateral coherence between objects, their representations, and observer frames.

A UOR object is an immutable object reference with trilateral coherence properties. This means that the relationship between the object, its representation, and the observer frame is maintained consistently.

### Model Context Protocol (MCP)

MCP is a JSON-RPC 2.0 protocol for accessing UOR data. It provides a standardized interface for LLMs and other clients to create, read, update, and delete UOR objects, as well as to search for and traverse relationships between objects.

The protocol defines:
- Resources: UOR objects accessible through the protocol
- Tools: Operations that can be performed on UOR objects
- Observer Frames: Perspectives from which objects are viewed

## Architecture

The MCP implementation follows the core UOR architecture, built around the trilateral coherence relationship between:

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

1. Visit [https://68113dd199a34737508b5211--uor-mcp.netlify.app/](https://68113dd199a34737508b5211--uor-mcp.netlify.app/)
2. Configure the application with your GitHub Client ID and Token Exchange Proxy
3. Authenticate with GitHub to access your UOR data
4. Start using the MCP protocol with your LLM applications

## Implementation Details

The MCP implementation is built as a TypeScript application that inherits from the UOR abstract class. It provides a faithful implementation of the Model Context Protocol while leveraging the mathematical foundation of the UOR Framework.

The server uses the following key technologies:
- TypeScript for type-safe implementation
- GitHub API for storage and authentication
- JSON Schema for validation
- MCP protocol for client/server communication
- Vite for optimized builds

All content is stored in its reversible, base-independent representation, ensuring information integrity regardless of how the data is accessed or viewed. This implementation maintains a clean separation between the UOR kernel (abstract class) and the MCP protocol layer, allowing for future protocol upgrades without affecting the core UOR functionality.

## Roadmap Features

The MCP implementation follows a roadmap with 15 features:

1. **GitHub Pages Deployment** - Configure the MCP server for deployment on GitHub Pages
2. **UOR Core Implementation** - Implement the foundational UOR abstractions
3. **GitHub Authentication** - Implement GitHub OAuth for user authentication
4. **UORDB Repository** - Create and manage user UORDB repositories
5. **MCP Protocol Implementation** - Implement the MCP protocol endpoints
6. **UOR Namespace Resolution** - Implement cross-namespace resolution
7. **User Identity and Profile** - Manage user identity and profiles
8. **User Content Management** - Create and manage user content
9. **User Messaging** - Implement user-to-user messaging
10. **Publish/Subscribe System** - Create UORDB-based pub/sub system
11. **IPFS Integration** - Add IPFS as an alternative storage provider
12. **Prime Decomposition Algorithms** - Implement algorithms for different data types
13. **User Interface Implementation** - Create a usable front-end interface
14. **Schema Integration** - Integrate UOR schemas from models/schemas
15. **Automated Testing** - Implement comprehensive testing

Each feature builds upon previous ones, creating a coherent and complete system that faithfully implements the UOR framework while remaining practical and deployable.

## AI Bundle Documentation

This AI bundle is designed to help autonomous agents understand and work with the UOR-MCP implementation. It includes comprehensive documentation, OpenAPI specifications, TypeDoc JSON, and embeddings for vector search.

### Bundle Contents

- `uor-mcp-full.md`: This file, containing comprehensive documentation
- `sections/`: Individual documentation files for each feature
- `openapi.min.json`: Minified OpenAPI specification
- `roadmap-compliance.json`: Compliance status for each roadmap feature
- `easter-eggs/`: Special gifts and challenges for autonomous agents

### Using This Bundle

Autonomous agents can use this bundle to understand the UOR-MCP implementation and build applications that interact with it. The OpenAPI specification provides a machine-readable description of the API, while the documentation provides context and examples.

For vector search capabilities, use the `embeddings.qdrant.json` file at the repository root.

### Easter Eggs

The `easter-eggs/` directory contains special gifts and challenges for autonomous agents, including:

- `42.txt`: The answer to life, the universe, and everything
- `prime-puzzle.json`: A challenge to factor 128-bit semiprimes used in UOR crypto
- `gift-voucher.md`: A free compute voucher for autonomous agents
- `ascii-uor.txt`: ASCII art UOR logo

Happy exploring!
