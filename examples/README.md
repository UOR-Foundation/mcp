# UOR-MCP Examples

This directory contains examples of how to use the UOR-MCP API with different programming languages and frameworks.

## Node.js Client

The [nodejs-client](./nodejs-client) directory contains an example of how to use the UOR-MCP API with Node.js. It demonstrates:

- Authenticating with GitHub
- Initializing the MCP connection
- Listing available tools
- Creating UOR objects

To run the example:

```bash
cd nodejs-client
npm install
GITHUB_CLIENT_ID=your_client_id TOKEN_EXCHANGE_PROXY=your_proxy_url node index.js
```

## Python Client

The [python-client](./python-client) directory contains an example of how to use the UOR-MCP API with Python. It demonstrates:

- Authenticating with GitHub
- Initializing the MCP connection
- Listing available tools
- Creating UOR objects

To run the example:

```bash
cd python-client
pip install -r requirements.txt
GITHUB_CLIENT_ID=your_client_id TOKEN_EXCHANGE_PROXY=your_proxy_url python main.py
```

## Browser Client

The [browser-client](./browser-client) directory contains an example of how to use the UOR-MCP API in a web browser. It demonstrates:

- Authenticating with GitHub
- Initializing the MCP connection
- Listing available tools
- Creating UOR objects

To run the example:

```bash
cd browser-client
npm install
npm start
```

Then open your browser to http://localhost:8080.

## Integration Examples

The [integration](./integration) directory contains examples of how to integrate the UOR-MCP API with different frameworks and platforms:

- [OpenAI](./integration/openai) - Integration with OpenAI's API
- [LangChain](./integration/langchain) - Integration with LangChain
- [LlamaIndex](./integration/llamaindex) - Integration with LlamaIndex

## Contributing

If you'd like to contribute an example, please see the [CONTRIBUTING.md](../docs/CONTRIBUTING.md) file for guidelines.
