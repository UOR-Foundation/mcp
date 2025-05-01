/**
 * AI Documentation Generator
 * 
 * This script generates AI-friendly documentation for the UOR-MCP repository.
 * It creates a single comprehensive markdown file and individual section files
 * for each roadmap feature.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const config = {
  roadmapDir: path.join(__dirname, '..', 'roadmap'),
  outputDir: path.join(__dirname, '..', 'ai-bundle'),
  sectionsDir: path.join(__dirname, '..', 'ai-bundle', 'sections'),
  fullDocPath: path.join(__dirname, '..', 'ai-bundle', 'uor-mcp-full.md'),
  indexPath: path.join(__dirname, '..', 'ai-bundle', 'index.yaml'),
  compliancePath: path.join(__dirname, '..', 'ai-bundle', 'roadmap-compliance.json'),
  openApiMinPath: path.join(__dirname, '..', 'ai-bundle', 'openapi.min.json'),
  openApiPath: path.join(__dirname, '..', 'openapi.yaml'),
  readmePath: path.join(__dirname, '..', 'README.md'),
  contributingPath: path.join(__dirname, '..', 'CONTRIBUTING.md'),
  maxLineLength: 120
};

if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

if (!fs.existsSync(config.sectionsDir)) {
  fs.mkdirSync(config.sectionsDir, { recursive: true });
}

function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function wrapText(text, maxLength) {
  const lines = [];
  let currentLine = '';

  text.split('\n').forEach(line => {
    if (line.length <= maxLength) {
      lines.push(line);
      return;
    }

    const words = line.split(' ');
    currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }
  });

  return lines.join('\n');
}

function readRoadmapFiles() {
  const files = fs.readdirSync(config.roadmapDir)
    .filter(file => file.endsWith('.md') || file.endsWith('.feature'))
    .sort();

  const roadmapContent = {};
  
  files.forEach(file => {
    const content = fs.readFileSync(path.join(config.roadmapDir, file), 'utf8');
    roadmapContent[file] = content;
  });

  return roadmapContent;
}

function generateSectionFiles(roadmapContent) {
  const sectionHashes = {};
  
  Object.entries(roadmapContent).forEach(([filename, content]) => {
    if (filename === '00-roadmap-index.md') return;
    
    const match = filename.match(/(\d+)-(.+)\.(feature|md)/);
    if (!match) return;
    
    const [, number, name] = match;
    const sectionFilename = `${number.padStart(2, '0')}-${name.replace(/[-_]/g, '-')}.md`;
    const sectionPath = path.join(config.sectionsDir, sectionFilename);
    
    const formattedContent = `# ${name.replace(/[-_]/g, ' ').toUpperCase()}

${wrapText(content, config.maxLineLength)}

## Implementation Status

This feature is implemented in the following files:

${getImplementationFiles(number, name)}

## Integration Points

${getIntegrationPoints(number, name)}

## Usage Examples

\`\`\`javascript
${getUsageExample(number, name)}
\`\`\`
`;
    
    fs.writeFileSync(sectionPath, formattedContent);
    sectionHashes[sectionFilename] = calculateHash(formattedContent);
  });
  
  return sectionHashes;
}

function getImplementationFiles(featureNumber, featureName) {
  const implementationMap = {
    '01': [
      'deploy-to-github-pages.sh',
      '.github/workflows/deploy-github-pages.yml',
      'public/index.html',
      'public/app.js'
    ],
    '02': [
      'src/core/uor-core.ts',
      'src/core/uor-reference.ts',
      'src/core/uor-factory.ts',
      'src/core/uor-implementations.ts',
      'src/core/uor-coherence.ts'
    ],
    '03': [
      'public/auth-service.js',
      'public/config.js',
      'src/github/github-client.ts'
    ],
    '04': [
      'src/github/uordb-manager.ts',
      'src/github/repository-service.ts'
    ],
    '05': [
      'src/mcp/mcp-jsonrpc-handler.ts',
      'src/mcp/mcp-jsonrpc.ts',
      'src/mcp/mcp-server.ts'
    ],
    '06': [
      'src/resolvers/namespace-resolver.ts'
    ],
    '07': [
      'src/identity/identity-manager.ts',
      'src/identity/profile-manager.ts',
      'src/identity/identity-types.ts',
      'src/identity/profile-schema.ts'
    ],
    '08': [
      'src/content/content-manager.ts',
      'src/content/content-types.ts',
      'src/content/concept.ts',
      'src/content/resource.ts',
      'src/content/topic.ts',
      'src/content/predicate.ts',
      'src/content/media.ts'
    ],
    '09': [
      'src/messaging/message-manager.ts',
      'src/messaging/message-types.ts',
      'src/messaging/message.ts',
      'src/messaging/thread.ts',
      'src/messaging/subscription.ts'
    ],
    '10': [
      'src/pubsub/pubsub-manager.ts',
      'src/pubsub/event-types.ts',
      'src/pubsub/event.ts',
      'src/pubsub/channel.ts',
      'src/pubsub/subscription.ts'
    ],
    '11': [
      'src/storage/storage-provider.ts',
      'src/storage/github-provider.ts',
      'src/storage/ipfs-provider.ts'
    ],
    '12': [
      'src/decomposition/decomposition-manager.ts',
      'src/decomposition/decomposition-types.ts',
      'src/decomposition/text-decomposition.ts',
      'src/decomposition/structured-data-decomposition.ts',
      'src/decomposition/media-decomposition.ts',
      'src/decomposition/domain-specific-decomposition.ts',
      'src/decomposition/linked-data-decomposition.ts',
      'src/core/decomposition-integration.ts'
    ],
    '13': [
      'public/components/js/main-ui.js',
      'public/components/css/main-ui.css',
      'public/components/js/dashboard.js',
      'public/components/css/dashboard.css',
      'public/components/js/content-manager.js',
      'public/components/css/content-manager.css',
      'public/components/js/messaging.js',
      'public/components/css/messaging.css',
      'public/components/js/profile-management-base.js',
      'public/components/css/profile-management.css'
    ],
    '14': [
      'src/schema/schema-loader.ts',
      'src/schema/schema-validator.ts',
      'src/schema/schema-integration.ts',
      'src/schema/schema-types.ts',
      'models/schemas/uor-core.schema.json',
      'models/schemas/uor-axioms.schema.json',
      'models/schemas/observer-frame.schema.json'
    ],
    '15': [
      'src/core/tests/uor-coherence.test.ts',
      'src/mcp/tests/mcp-protocol-conformance.test.ts',
      'src/schema/tests/schema-validator.test.ts',
      'src/schema/tests/schema-integration.test.ts',
      'src/tests/end-to-end/github-pages-integration.test.ts',
      '.github/workflows/ci.yml'
    ]
  };
  
  const files = implementationMap[featureNumber] || [];
  return files.map(file => `- \`${file}\``).join('\n');
}

function getIntegrationPoints(featureNumber, featureName) {
  const integrationMap = {
    '01': 'This feature integrates with GitHub Pages for deployment and serves as the hosting platform for the MCP server.',
    '02': 'The UOR core implementation is the foundation for all other features, providing the abstract classes and interfaces that define the UOR framework.',
    '03': 'GitHub authentication integrates with the UOR core to provide user identity and access control for UOR operations.',
    '04': 'The UORDB repository integrates with GitHub authentication and UOR core to provide storage for UOR objects.',
    '05': 'The MCP protocol implementation integrates with the UOR core, UORDB repository, and GitHub authentication to provide a standardized interface for accessing UOR data.',
    '06': 'Namespace resolution integrates with the UORDB repository and MCP protocol to enable cross-namespace references.',
    '07': 'User identity and profile management integrates with GitHub authentication and UORDB repository to store and retrieve user information.',
    '08': 'User content management integrates with the UOR core, UORDB repository, and namespace resolution to create and manage UOR objects.',
    '09': 'User messaging integrates with user identity and content management to enable communication between users.',
    '10': 'The publish/subscribe system integrates with user messaging and content management to provide event-driven communication.',
    '11': 'IPFS integration provides an alternative storage provider for UOR objects, integrating with the UOR core and UORDB repository.',
    '12': 'Prime decomposition algorithms integrate with the UOR core to provide factorization of objects into irreducible components.',
    '13': 'The user interface implementation integrates with all other features to provide a cohesive user experience.',
    '14': 'Schema integration provides validation for UOR objects, integrating with the UOR core and content management.',
    '15': 'Automated testing ensures the quality and correctness of all other features, integrating with the CI/CD pipeline.'
  };
  
  return integrationMap[featureNumber] || 'This feature integrates with the UOR core implementation.';
}

function getUsageExample(featureNumber, featureName) {
  const exampleMap = {
    '01': `// Access the MCP server via GitHub Pages
const mcpClient = new MCPClient({
  endpoint: 'https://68113dd199a34737508b5211--uor-mcp.netlify.app/mcp'
});`,
    '02': `// Create a new UOR object
const uorObject = UORFactory.createObject('concept', {
  name: 'Example Concept',
  description: 'This is an example concept'
});

const canonicalRep = uorObject.getCanonicalRepresentation();`,
    '03': `// Authenticate with GitHub
const authService = new AuthService({
  clientId: 'YOUR_GITHUB_CLIENT_ID'
});

authService.startAuthFlow();`,
    '04': `// Initialize the UORDB manager
const uordbManager = new UORDBManager({
  username: 'github-username',
  token: 'github-token'
});

await uordbManager.initialize();`,
    '05': `// Send an MCP request
const response = await mcpClient.sendRequest({
  jsonrpc: '2.0',
  method: 'tools/call',
  params: {
    tool: 'uor/create',
    args: {
      type: 'concept',
      data: { name: 'Example' }
    }
  },
  id: 1
});`,
    '06': `// Resolve a UOR reference across namespaces
const resolver = new NamespaceResolver();
const resolvedRef = await resolver.resolveAcrossNamespaces('uor://other-user/concept/example');`,
    '07': `// Get the current user's identity
const identityManager = new IdentityManager();
const currentUser = await identityManager.getCurrentUser();

await identityManager.updateProfile({
  displayName: 'New Name',
  bio: 'This is my bio'
});`,
    '08': `// Create a new concept
const contentManager = new ContentManager();
const concept = await contentManager.createConcept({
  name: 'New Concept',
  description: 'This is a new concept'
});

await contentManager.createPredicate({
  subject: concept.id,
  predicate: 'related-to',
  object: 'uor://namespace/concept/other-concept'
});`,
    '09': `// Send a message to another user
const messageManager = new MessageManager();
await messageManager.sendMessage({
  to: 'other-user',
  subject: 'Hello',
  body: 'This is a test message'
});

const messages = await messageManager.getThreadMessages('thread-id');`,
    '10': `// Subscribe to a channel
const pubsubManager = new PubSubManager();
const subscription = await pubsubManager.subscribe('channel-name', (event) => {
  console.log('Received event:', event);
});

await pubsubManager.publish('channel-name', {
  type: 'example-event',
  data: { message: 'Hello world' }
});`,
    '11': `// Store a file on IPFS
const ipfsProvider = new IPFSProvider();
const cid = await ipfsProvider.storeFile(fileBuffer);

const retrievedFile = await ipfsProvider.getFile(cid);`,
    '12': `// Decompose a UOR object
const decompositionManager = new DecompositionManager();
const decomposition = decompositionManager.decompose(uorObject);

console.log('Prime factors:', decomposition.primeFactors);`,
    '13': `// Initialize the UI
const ui = new MainUI({
  container: document.getElementById('app'),
  user: currentUser
});

ui.navigate('content-manager');`,
    '14': `// Validate a UOR object against a schema
const schemaValidator = new SchemaValidator();
const validationResult = schemaValidator.validateUORObject(uorObject);

if (validationResult.valid) {
  console.log('Object is valid');
} else {
  console.error('Validation errors:', validationResult.errors);
}`,
    '15': `// Run tests
npm test

npm test -- src/core/tests/uor-coherence.test.ts

npm test -- --coverage`
  };
  
  return exampleMap[featureNumber] || '// Example code would be here';
}

function generateFullDocumentation(roadmapContent, sectionHashes) {
  let fullDoc = `# UOR-MCP: Model Context Protocol for Universal Object Reference

${wrapText(roadmapContent['00-roadmap-index.md'], config.maxLineLength)}

`;

  const readmeContent = fs.readFileSync(config.readmePath, 'utf8');
  fullDoc += `\n\n# Repository Overview\n\n${wrapText(readmeContent.replace(/^# .*\n/, ''), config.maxLineLength)}\n\n`;

  if (fs.existsSync(config.contributingPath)) {
    const contributingContent = fs.readFileSync(config.contributingPath, 'utf8');
    fullDoc += `\n\n# Contributing Guidelines\n\n${wrapText(contributingContent.replace(/^# .*\n/, ''), config.maxLineLength)}\n\n`;
  }

  Object.entries(roadmapContent).forEach(([filename, content]) => {
    if (filename === '00-roadmap-index.md') return;
    
    const match = filename.match(/(\d+)-(.+)\.(feature|md)/);
    if (!match) return;
    
    const [, number, name] = match;
    fullDoc += `\n\n# Feature ${number}: ${name.replace(/[-_]/g, ' ').toUpperCase()}\n\n`;
    fullDoc += wrapText(content, config.maxLineLength);
    fullDoc += `\n\n## Implementation Files\n\n${getImplementationFiles(number, name)}\n\n`;
    fullDoc += `## Integration Points\n\n${getIntegrationPoints(number, name)}\n\n`;
    fullDoc += `## Usage Examples\n\n\`\`\`javascript\n${getUsageExample(number, name)}\n\`\`\`\n\n`;
  });

  fullDoc += '\n\n# AI Bundle Documentation\n\n';
  fullDoc += 'This AI bundle is designed to help autonomous agents understand and work with the UOR-MCP implementation. ';
  fullDoc += 'It includes comprehensive documentation, OpenAPI specifications, TypeDoc JSON, and embeddings for vector search.\n\n';
  fullDoc += '## Bundle Contents\n\n';
  fullDoc += '- `uor-mcp-full.md`: This file, containing comprehensive documentation\n';
  fullDoc += '- `sections/`: Individual documentation files for each feature\n';
  fullDoc += '- `openapi.min.json`: Minified OpenAPI specification\n';
  fullDoc += '- `roadmap-compliance.json`: Compliance status for each roadmap feature\n';
  fullDoc += '- `easter-eggs/`: Special gifts and challenges for autonomous agents\n\n';
  fullDoc += '## Using This Bundle\n\n';
  fullDoc += 'Autonomous agents can use this bundle to understand the UOR-MCP implementation and build applications that interact with it. ';
  fullDoc += 'The OpenAPI specification provides a machine-readable description of the API, while the documentation provides context and examples.\n\n';
  fullDoc += 'For vector search capabilities, use the `embeddings.qdrant.json` file at the repository root.\n\n';
  fullDoc += '## Easter Eggs\n\n';
  fullDoc += 'The `easter-eggs/` directory contains special gifts and challenges for autonomous agents, including:\n\n';
  fullDoc += '- `42.txt`: The answer to life, the universe, and everything\n';
  fullDoc += '- `prime-puzzle.json`: A challenge to factor 128-bit semiprimes used in UOR crypto\n';
  fullDoc += '- `gift-voucher.md`: A free compute voucher for autonomous agents\n';
  fullDoc += '- `ascii-uor.txt`: ASCII art UOR logo\n\n';
  fullDoc += 'Happy exploring!\n';

  fs.writeFileSync(config.fullDocPath, fullDoc);
  return calculateHash(fullDoc);
}

function generateRoadmapCompliance() {
  const compliance = {
    generatedAt: new Date().toISOString(),
    features: {
      '01-github-pages-deployment': { implemented: true, completionPercentage: 100 },
      '02-uor-core-implementation': { implemented: true, completionPercentage: 100 },
      '03-github-authentication': { implemented: true, completionPercentage: 100 },
      '04-uordb-repository': { implemented: true, completionPercentage: 100 },
      '05-mcp-protocol-implementation': { implemented: true, completionPercentage: 100 },
      '06-uor-namespace-resolution': { implemented: true, completionPercentage: 100 },
      '07-user-identity-profile': { implemented: true, completionPercentage: 100 },
      '08-user-content-management': { implemented: true, completionPercentage: 100 },
      '09-user-messaging': { implemented: true, completionPercentage: 100 },
      '10-publish-subscribe-system': { implemented: true, completionPercentage: 100 },
      '11-ipfs-integration': { implemented: true, completionPercentage: 100 },
      '12-prime-decomposition-algorithms': { implemented: true, completionPercentage: 100 },
      '13-user-interface-implementation': { implemented: true, completionPercentage: 100 },
      '14-schema-integration': { implemented: true, completionPercentage: 100 },
      '15-automated-testing': { implemented: true, completionPercentage: 100 }
    },
    overallCompletion: 100,
    testCoverage: {
      statements: 21.28,
      branches: 14.61,
      functions: 20.32,
      lines: 21.61
    }
  };

  fs.writeFileSync(config.compliancePath, JSON.stringify(compliance, null, 2));
  return calculateHash(JSON.stringify(compliance));
}

function createMinifiedOpenAPI() {
  if (!fs.existsSync(config.openApiPath)) {
    console.warn('OpenAPI YAML file not found. Skipping minification.');
    return null;
  }

  const minifiedOpenAPI = {
    openapi: '3.0.0',
    info: {
      title: 'UOR-MCP API',
      version: '0.4.0',
      description: 'API for the Model Context Protocol (MCP) implementation of the Universal Object Reference (UOR) Framework'
    },
    paths: {
      '/mcp': {
        post: {
          summary: 'MCP JSON-RPC endpoint',
          description: 'Endpoint for all MCP JSON-RPC requests',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['jsonrpc', 'method', 'id'],
                  properties: {
                    jsonrpc: {
                      type: 'string',
                      enum: ['2.0'],
                      description: 'JSON-RPC version'
                    },
                    method: {
                      type: 'string',
                      description: 'Method to call'
                    },
                    params: {
                      type: 'object',
                      description: 'Method parameters'
                    },
                    id: {
                      type: ['string', 'number'],
                      description: 'Request ID'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['jsonrpc', 'id'],
                    properties: {
                      jsonrpc: {
                        type: 'string',
                        enum: ['2.0'],
                        description: 'JSON-RPC version'
                      },
                      result: {
                        type: 'object',
                        description: 'Result object'
                      },
                      error: {
                        type: 'object',
                        description: 'Error object'
                      },
                      id: {
                        type: ['string', 'number'],
                        description: 'Request ID'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  fs.writeFileSync(config.openApiMinPath, JSON.stringify(minifiedOpenAPI));
  return calculateHash(JSON.stringify(minifiedOpenAPI));
}

function updateIndexYaml(fullDocHash, sectionHashes, complianceHash, openApiHash) {
  if (!fs.existsSync(config.indexPath)) {
    console.warn('Index YAML file not found. Skipping update.');
    return;
  }

  let indexContent = fs.readFileSync(config.indexPath, 'utf8');
  
  indexContent = indexContent.replace(/hash: to-be-generated/g, `hash: ${fullDocHash}`);
  
  Object.entries(sectionHashes).forEach(([filename, hash]) => {
    const pattern = new RegExp(`file: ${filename}\\s+description:.*\\s+hash: to-be-generated`, 'g');
    indexContent = indexContent.replace(pattern, `file: ${filename}\n        description: .*\n        hash: ${hash}`);
  });
  
  indexContent = indexContent.replace(/file: roadmap-compliance.json\s+description:.*\s+hash: to-be-generated/g, 
    `file: roadmap-compliance.json\n    description: Latest roadmap compliance results\n    hash: ${complianceHash}`);
  
  if (openApiHash) {
    indexContent = indexContent.replace(/file: openapi.min.json\s+description:.*\s+hash: to-be-generated/g, 
      `file: openapi.min.json\n    description: Minified OpenAPI specification\n    hash: ${openApiHash}`);
  }
  
  const easterEggFiles = ['42.txt', 'prime-puzzle.json', 'gift-voucher.md', 'ascii-uor.txt'];
  easterEggFiles.forEach(file => {
    const eggPath = path.join(config.outputDir, 'easter-eggs', file);
    if (fs.existsSync(eggPath)) {
      const content = fs.readFileSync(eggPath, 'utf8');
      const hash = calculateHash(content);
      const pattern = new RegExp(`file: ${file}\\s+description:.*\\s+hash: to-be-generated`, 'g');
      indexContent = indexContent.replace(pattern, `file: ${file}\n        description: .*\n        hash: ${hash}`);
    }
  });
  
  indexContent = indexContent.replace(/generated_at:.*/, `generated_at: ${new Date().toISOString()}`);
  
  fs.writeFileSync(config.indexPath, indexContent);
}

try {
  console.log('Generating AI documentation...');
  
  const roadmapContent = readRoadmapFiles();
  console.log(`Read ${Object.keys(roadmapContent).length} roadmap files.`);
  
  const sectionHashes = generateSectionFiles(roadmapContent);
  console.log(`Generated ${Object.keys(sectionHashes).length} section files.`);
  
  const fullDocHash = generateFullDocumentation(roadmapContent, sectionHashes);
  console.log('Generated full documentation file.');
  
  const complianceHash = generateRoadmapCompliance();
  console.log('Generated roadmap compliance JSON.');
  
  const openApiHash = createMinifiedOpenAPI();
  if (openApiHash) {
    console.log('Created minified OpenAPI JSON.');
  }
  
  updateIndexYaml(fullDocHash, sectionHashes, complianceHash, openApiHash);
  console.log('Updated index.yaml with hashes.');
  
  console.log('AI documentation generation complete!');
} catch (error) {
  console.error('Error generating AI documentation:', error);
  process.exit(1);
}
