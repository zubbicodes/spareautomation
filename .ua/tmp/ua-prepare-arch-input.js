const fs = require('fs');

const graphPath = process.argv[2];
const outputPath = process.argv[3];
if (!graphPath || !outputPath) {
  console.error('Usage: node ua-prepare-arch-input.js <graph.json> <output.json>');
  process.exit(1);
}

try {
  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const allowedTypes = new Set([
    'file', 'config', 'document', 'service', 'pipeline',
    'table', 'schema', 'resource', 'endpoint',
  ]);
  const fileNodes = graph.nodes.filter((node) => allowedTypes.has(node.type));
  const ids = new Set(fileNodes.map((node) => node.id));
  const allEdges = graph.edges.filter(
    (edge) => ids.has(edge.source) && ids.has(edge.target),
  );
  const importEdges = allEdges.filter((edge) => edge.type === 'imports');
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ fileNodes, importEdges, allEdges }, null, 2) + '\n',
  );
  console.log(`Prepared ${fileNodes.length} nodes, ${importEdges.length} imports, ${allEdges.length} file-level edges.`);
} catch (error) {
  console.error(error.stack || String(error));
  process.exit(1);
}
