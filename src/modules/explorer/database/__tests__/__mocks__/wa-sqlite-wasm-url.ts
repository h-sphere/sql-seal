// Mock for virtual:wa-sqlite-wasm-url used in tests
// wa-sqlite expects a file path in Node.js environment (not a data URL)

import { join } from 'path';

const wasmPath = join(process.cwd(), 'node_modules/wa-sqlite/dist/wa-sqlite-async.wasm');

export default wasmPath;
