import { App } from "obsidian"
import * as Comlink from 'comlink'
// @ts-ignore
import workerCode from 'virtual:worker-code'
import { WorkerDatabase } from "./worker/database";

export class SqlSealDatabase {
    db: Comlink.Remote<WorkerDatabase>
    private isConnected = false
    private connectingPromise: Promise<void>;
    constructor(private readonly app: App, private readonly verbose = false) {

    }

    registerCustomFunction(name: string, argsCount = 1) {
        return this.db.registerCustomFunction(name, argsCount)
    }

    async connect() {
        if (this.isConnected) {
            return Promise.resolve()
        }

        if (this.connectingPromise) {
            return this.connectingPromise
        }

        this.connectingPromise = new Promise(async (resolve, reject) => {
            try {
                const blob = new Blob([workerCode], { type: 'text/javascript' });
                const workerUrl = URL.createObjectURL(blob);
                
                const worker = new Worker(workerUrl, {
                    name: 'SQLSeal Database'
                });
                const DatabaseWrap = Comlink.wrap<typeof WorkerDatabase>(worker)

                const instance = await new DatabaseWrap()

                await instance.connect()
                this.db = instance
                this.isConnected = true
                resolve()
            } catch (e) {
                reject(e)
            }
        })
        return this.connectingPromise
    }

    async disconect() {
        if (!this.isConnected) {
            return
        }
        this.db.disconnect()
        this.isConnected = false
    }

    async recreateDatabase() {
        await this.db.recreateDatabase()
    }

    async updateData(name: string, data: Array<Record<string, unknown>>, key: string = 'id') {
        return this.db.updateData(name, data, key)
    }

    async deleteData(name: string, data: Array<Record<string, unknown>>, key: string = 'id') {
        return this.db.deleteData(name, data, key)
    }

    async insertData(name: string, inData: Array<Record<string, unknown>>) {
        return this.db.insertData(name, inData)
    }

    async dropTable(name: string) { 
        return this.db.dropTable(name)
    }

    async createTableNoTypes(name: string, columns: string[], noDrop?: boolean) {
        await this.db.createTableNoTypes(name, columns, noDrop)
    }

    async getColumns(tableName: string) {
        return this.db.getColumns(tableName)
    }

    async addColumns(tableName: string, newColumns: string[]) {
        return this.db.addColumns(tableName, newColumns)
    }

    async select(statement: string, frontmatter: Record<string, unknown>) {
        const result = await this.db.select(statement, frontmatter)
        return result
    }
}