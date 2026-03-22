// Mock for virtual:wa-sqlite-wasm-url used in tests
// Returns a file:// URL that works with the fetch polyfill in jest.setup.mjs

import { join } from 'path';
import { pathToFileURL } from 'url';

const wasmPath = join(process.cwd(), 'node_modules/wa-sqlite/dist/wa-sqlite-async.wasm');
const wasmUrl = pathToFileURL(wasmPath).href;

export default wasmUrl;
