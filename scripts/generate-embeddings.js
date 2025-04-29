/**
 * Embeddings Generator for UOR-MCP
 * 
 * This script generates vector embeddings for the UOR-MCP documentation
 * and stores them in a Qdrant-compatible JSON format.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const config = {
  aiBundle: path.join(__dirname, '..', 'ai-bundle'),
  fullDocPath: path.join(__dirname, '..', 'ai-bundle', 'uor-mcp-full.md'),
  sectionsDir: path.join(__dirname, '..', 'ai-bundle', 'sections'),
  outputPath: path.join(__dirname, '..', 'embeddings.qdrant.json'),
  dimensions: 384, // Simulating 384-dimensional embeddings
  chunkSize: 1000, // Characters per chunk
  chunkOverlap: 200 // Character overlap between chunks
};

function generatePseudoRandomVector(text, dimensions) {
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  
  const seed = parseInt(hash.substring(0, 8), 16);
  
  const vector = new Array(dimensions);
  let x = seed;
  
  for (let i = 0; i < dimensions; i++) {
    x = (1664525 * x + 1013904223) % 4294967296;
    vector[i] = (x / 2147483648) - 1;
  }
  
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
}

function chunkText(text, chunkSize, chunkOverlap) {
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    chunks.push(text.substring(startIndex, endIndex));
    startIndex += chunkSize - chunkOverlap;
  }
  
  return chunks;
}

function extractMetadata(text, source) {
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Untitled';
  
  const sectionMatch = source.match(/(\d+)-(.+)\.md$/);
  const section = sectionMatch ? `Feature ${sectionMatch[1]}: ${sectionMatch[2].replace(/-/g, ' ')}` : '';
  
  return {
    title,
    section,
    source,
    chars: text.length,
    tokens: Math.ceil(text.length / 4) // Rough estimate of tokens
  };
}

async function generateEmbeddings() {
  console.log('Generating embeddings...');
  
  const embeddings = [];
  let documentId = 1;
  
  if (fs.existsSync(config.fullDocPath)) {
    const fullDoc = fs.readFileSync(config.fullDocPath, 'utf8');
    const chunks = chunkText(fullDoc, config.chunkSize, config.chunkOverlap);
    
    console.log(`Processing full documentation (${chunks.length} chunks)...`);
    
    chunks.forEach((chunk, index) => {
      const vector = generatePseudoRandomVector(chunk, config.dimensions);
      const metadata = extractMetadata(chunk, 'uor-mcp-full.md');
      
      embeddings.push({
        id: `doc-${documentId++}`,
        vector,
        payload: {
          text: chunk,
          metadata: {
            ...metadata,
            chunk_index: index,
            total_chunks: chunks.length
          }
        }
      });
    });
  }
  
  if (fs.existsSync(config.sectionsDir)) {
    const sectionFiles = fs.readdirSync(config.sectionsDir)
      .filter(file => file.endsWith('.md'))
      .sort();
    
    console.log(`Processing ${sectionFiles.length} section files...`);
    
    for (const file of sectionFiles) {
      const filePath = path.join(config.sectionsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const chunks = chunkText(content, config.chunkSize, config.chunkOverlap);
      
      chunks.forEach((chunk, index) => {
        const vector = generatePseudoRandomVector(chunk, config.dimensions);
        const metadata = extractMetadata(chunk, file);
        
        embeddings.push({
          id: `doc-${documentId++}`,
          vector,
          payload: {
            text: chunk,
            metadata: {
              ...metadata,
              chunk_index: index,
              total_chunks: chunks.length
            }
          }
        });
      });
    }
  }
  
  const qdrantCollection = {
    collection_name: 'uor_mcp_docs',
    vectors: {
      size: config.dimensions,
      distance: 'Cosine'
    },
    embeddings
  };
  
  fs.writeFileSync(config.outputPath, JSON.stringify(qdrantCollection, null, 2));
  console.log(`Generated ${embeddings.length} embeddings and saved to ${config.outputPath}`);
}

generateEmbeddings().catch(error => {
  console.error('Error generating embeddings:', error);
  process.exit(1);
});
