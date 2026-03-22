// Jest setup file for ESM mode
// Polyfill fetch to handle file:// URLs for wa-sqlite WASM loading

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const originalFetch = global.fetch;

global.fetch = async function (url, options) {
  // Handle file:// URLs by reading from filesystem
  if (typeof url === 'string' && url.startsWith('file://')) {
    try {
      const filePath = fileURLToPath(url);
      const buffer = readFileSync(filePath);

      // Return a proper Response object
      return new Response(buffer, {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/wasm',
          'Content-Length': buffer.length.toString(),
        },
      });
    } catch (error) {
      return new Response(null, {
        status: 404,
        statusText: 'Not Found',
      });
    }
  }

  // Fall back to original fetch for http:// and https://
  if (originalFetch) {
    return originalFetch(url, options);
  }

  throw new Error('fetch is not available');
};
