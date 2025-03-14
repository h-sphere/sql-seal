import { App } from "obsidian"
import * as Comlink from 'comlink'
// @ts-ignore
import workerCode from 'virtual:worker-code'
import { WorkerDatabase } from "./worker/database";
import { sanitise } from "../utils/sanitiseColumn";

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

                const filename = sanitise(this.app.vault.getName()) + '___' + (this.app as any).appId

                const instance = await new DatabaseWrap(filename)

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

    async createIndex(indexName: string, tableName: string, columns: string[]) {
        await this.db.createIndex(indexName, tableName, columns)
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

    async explain(statement: string, frontmatter: Record<string, unknown>) {
        const explainResults = await this.db.explainQuery(statement, frontmatter)
        let strResult = '';
        const map = new Map<number, number>()
        const INDENT_INCREASE = 4
        map.set(0, -INDENT_INCREASE)
        for (const result of explainResults) {
            const parent = parseInt((result.parent as unknown as  string) ?? '0', 10)
            const indent = map.get(parent)! + INDENT_INCREASE
            for (let i=0;i<indent;i++) {
                strResult += ' '
            }
            strResult += result.detail + "\n"
            map.set(result.id as number, indent)
        }
        return strResult
    }
}