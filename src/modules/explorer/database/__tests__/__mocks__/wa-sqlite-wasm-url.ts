// Mock for virtual:wa-sqlite-wasm-url used in tests
// Returns the WASM binary as Uint8Array (same as production build)

import { join } from 'path';
import { readFileSync } from 'fs';

const wasmPath = join(process.cwd(), 'node_modules/wa-sqlite/dist/wa-sqlite-async.wasm');
const wasmBinary = new Uint8Array(readFileSync(wasmPath));

export default wasmBinary;
