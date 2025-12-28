// Mock for virtual:sqljs-wasm-url
// In Node.js (Jest), sql.js expects a file path, not a data URL
// In the browser (production), esbuild provides a data URL
import { join } from 'path';

const wasmPath = join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');

export default wasmPath;
