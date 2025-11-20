import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function collectStubs(dir) {
  const files = {};
  function walk(folder) {
    const entries = fs.readdirSync(folder, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.pyi')) {
        const relativePath = path.relative(dir, fullPath).replace(/\\/g, '/');
        const virtualPath = `/${relativePath}`;
        files[virtualPath] = fs.readFileSync(fullPath, 'utf8');
      }
    }
  }
  walk(dir);
  return files;
}
const stubsDir = path.resolve(__dirname, './stdlib');

const stubFiles = collectStubs(stubsDir);
console.log(`Loaded ${Object.keys(stubFiles).length} stub files`);

await fs.promises.writeFile('./stub-bundle.json', JSON.stringify(stubFiles, null, 2));
console.log('stub-bundle.json created!');
