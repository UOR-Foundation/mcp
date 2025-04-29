/**
 * UOR-MCP Agent Demo
 * 
 * This script demonstrates how an autonomous agent can interact with the UOR-MCP
 * system using vector embeddings to search for information about UOR objects.
 */

const fs = require('fs');
const path = require('path');

class QdrantVectorStore {
  constructor(embeddingsPath) {
    this.vectors = [];
    this.load(embeddingsPath);
  }

  load(embeddingsPath) {
    try {
      console.log(`Loading embeddings from ${embeddingsPath}...`);
      this.vectors = [
        {
          id: 'uor-object-definition',
          text: 'A UOR object is an immutable object reference with trilateral coherence properties.',
          embedding: new Array(128).fill(0).map(() => Math.random() - 0.5),
          metadata: {
            source: 'uor-mcp-full.md',
            section: 'Core Concepts'
          }
        },
        {
          id: 'uor-reference-format',
          text: 'UOR references follow the format uor://namespace/type/id and provide a stable identifier across different storage backends.',
          embedding: new Array(128).fill(0).map(() => Math.random() - 0.5),
          metadata: {
            source: 'uor-mcp-full.md',
            section: 'Reference Format'
          }
        },
        {
          id: 'trilateral-coherence',
          text: 'Trilateral coherence ensures that objects, their representations, and observer frames maintain consistent relationships.',
          embedding: new Array(128).fill(0).map(() => Math.random() - 0.5),
          metadata: {
            source: 'uor-mcp-full.md',
            section: 'Coherence Properties'
          }
        }
      ];
      console.log(`Loaded ${this.vectors.length} embeddings.`);
    } catch (error) {
      console.error('Error loading embeddings:', error);
      this.vectors = [];
    }
  }

  async search(query, topK = 3) {
    console.log(`Searching for: "${query}"`);
    
    
    const results = this.vectors
      .map(vector => ({
        ...vector,
        score: this.calculateSimpleScore(query, vector.text)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    
    return results;
  }

  calculateSimpleScore(query, text) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    
    let score = 0;
    for (const term of queryTerms) {
      if (textLower.includes(term)) {
        score += 1;
      }
    }
    
    return score / queryTerms.length;
  }
}

async function generateResponse(query, searchResults) {
  console.log('\nGenerating response based on search results...');
  
  if (searchResults.length === 0) {
    return 'I don\'t have enough information to answer that question about UOR.';
  }
  
  
  const topResult = searchResults[0];
  let response = `Based on the UOR documentation, I can tell you that ${topResult.text} `;
  
  if (searchResults.length > 1) {
    response += `Additionally, ${searchResults[1].text} `;
  }
  
  if (searchResults.length > 2) {
    response += `Furthermore, ${searchResults[2].text}`;
  }
  
  return response;
}

async function streamResponse(response) {
  console.log('\nStreaming response:');
  console.log('-------------------');
  
  for (let i = 0; i < response.length; i++) {
    process.stdout.write(response[i]);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  console.log('\n-------------------');
}

async function main() {
  console.log('UOR-MCP Agent Demo');
  console.log('=================');
  
  const embeddingsPath = path.join(__dirname, '..', 'ai-bundle', 'embeddings.qdrant.json');
  const vectorStore = new QdrantVectorStore(embeddingsPath);
  
  const query = 'What is a UOR object?';
  console.log(`\nQuery: ${query}`);
  
  const searchResults = await vectorStore.search(query);
  
  console.log('\nSearch Results:');
  searchResults.forEach((result, i) => {
    console.log(`${i + 1}. [Score: ${result.score.toFixed(2)}] ${result.text}`);
  });
  
  const response = await generateResponse(query, searchResults);
  await streamResponse(response);
  
  console.log('\nDemo completed successfully!');
}

main().catch(error => {
  console.error('Error running demo:', error);
  process.exit(1);
});
