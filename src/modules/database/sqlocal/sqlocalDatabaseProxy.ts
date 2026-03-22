import { App } from "obsidian";
import * as Comlink from 'comlink';
import { SqlocalWorkerDatabase } from "./sqlocalWorkerDatabase";
import { ColumnDefinition } from "../../../utils/types";
import { sanitise } from "../../../utils/sanitiseColumn";

/**
 * Main-thread proxy for SqlocalWorkerDatabase.
 * All database operations are executed in a Web Worker to avoid blocking the main thread.
 *
 * This class has the same API as SqlocalDatabase but communicates with the worker
 * via Comlink (using postMessage under the hood).
 */
export class SqlocalDatabaseProxy {
    private db?: Comlink.Remote<SqlocalWorkerDatabase>;
    private isConnected = false;
    private connectingPromise?: Promise<void>;
    private worker?: Worker;

    constructor(private readonly app: App, private readonly dbName: string) {
    }

    async connect() {
        if (this.isConnected) {
            return Promise.resolve();
        }

        if (this.connectingPromise) {
            return this.connectingPromise;
        }

        this.connectingPromise = new Promise(async (resolve, reject) => {
            try {
                // Import the worker code built by esbuild
                // @ts-ignore
                const workerCodeModule = await import('virtual:sqlocal-worker-code');
                const workerCode = workerCodeModule.default;

                // Create worker from blob
                const blob = new Blob([workerCode], { type: 'text/javascript' });
                const workerUrl = URL.createObjectURL(blob);

                this.worker = new Worker(workerUrl, {
                    name: 'SQLSeal Sqlocal Database'
                });

                // Wrap worker with Comlink
                const DatabaseWrap = Comlink.wrap<typeof SqlocalWorkerDatabase>(this.worker);

                const instance = await new DatabaseWrap(this.dbName);

                await instance.connect();

                this.db = instance;
                this.isConnected = true;
                resolve();
            } catch (e) {
                console.error('SqlocalDatabaseProxy: Failed to initialize worker database:', e);
                reject(e);
            }
        });

        return this.connectingPromise;
    }

    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        await this.db?.disconnect();
        if (this.worker) {
            this.worker.terminate();
            this.worker = undefined;
        }
        this.db = undefined;
        this.isConnected = false;
    }

    registerCustomFunction(name: string, argsCount = 1) {
        return this.db?.registerCustomFunction(name, argsCount);
    }

    async recreateDatabase() {
        return this.db?.recreateDatabase();
    }

    async updateData(name: string, data: Array<Record<string, unknown>>, key: string = 'id') {
        return this.db?.updateData(name, data, key);
    }

    async deleteData(name: string, data: Array<Record<string, unknown>>, key: string = 'id') {
        return this.db?.deleteData(name, data, key);
    }

    async insertData(name: string, inData: Array<Record<string, unknown>>) {
        return this.db?.insertData(name, inData);
    }

    async dropTable(name: string) {
        return this.db?.dropTable(name);
    }

    async createTableNoTypes(name: string, columns: string[], noDrop?: boolean) {
        return this.db?.createTableNoTypes(name, columns, noDrop);
    }

    async createTable(name: string, columns: ColumnDefinition[], noDrop?: boolean) {
        return this.db?.createTable(name, columns, noDrop);
    }

    async createIndex(indexName: string, tableName: string, columns: string[]) {
        return this.db?.createIndex(indexName, tableName, columns);
    }

    async getColumns(name: string) {
        return this.db?.getColumns(name);
    }

    async count(tableName: string) {
        return this.db?.count(tableName);
    }

    async addColumns(tableName: string, newColumns: string[]) {
        return this.db?.addColumns(tableName, newColumns);
    }

    async select(statement: string, frontmatter: Record<string, unknown>) {
        return this.db?.select(statement, frontmatter);
    }

    async explain(statement: string, frontmatter: Record<string, unknown>) {
        return this.db?.explain(statement, frontmatter) ?? "";
    }

    async hasTable(tableName: string) {
        return this.db?.hasTable(tableName);
    }
}
