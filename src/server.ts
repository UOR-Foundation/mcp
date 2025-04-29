/**
 * UOR MCP Server with MCP Protocol Implementation
 *
 * This file serves as the main server entry point for the UOR Framework
 * and implements the MCP Protocol for standardized tool interactions.
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import apiHandler from './api-handler';

// Create Express server
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint
app.post('/api', async (req, res) => {
  await apiHandler.handleAPIRequest(req, res);
});

// MCP protocol endpoint
app.post('/mcp', async (req, res) => {
  await apiHandler.handleMCPEndpoint(req, res);
});

// Start the server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`UOR MCP Server is running at http://localhost:${port}`);
    console.log(`MCP Protocol endpoint: http://localhost:${port}/mcp`);
  });
}

export default app;
