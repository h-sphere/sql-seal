// Type declarations for wa-sqlite modules without TypeScript support

declare module 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js' {
    export interface VFSOptions {
        durability?: "default" | "strict" | "relaxed";
        purge?: "deferred" | "manual";
        purgeAtLeast?: number;
    }

    export class IDBBatchAtomicVFS {
        constructor(idbDatabaseName?: string, options?: VFSOptions);
        close(): Promise<void>;
        name: string;
    }
}
