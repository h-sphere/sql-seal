import { App } from "obsidian"
import { FieldTypes, toTypeStatements } from "../utils/typePredictions"
import * as Comlink from 'comlink'
import workerCode from 'virtual:worker-code'
import { WorkerDatabase } from "./worker/database";

export interface FieldDefinition {
    name: string;
    type: FieldTypes
}

const formatData = (data: Record<string, any>) => {
    return Object.keys(data).reduce((ret, key) => {
        if (typeof data[key] === 'boolean') {
            return {
                ...ret,
                [key]: data[key] ? 1 : 0
            }
        }
        if (!data[key]) {
            return {
                ...ret,
                [key]: null
            }
        }
        if (typeof data[key] === 'object' || Array.isArray(data[key])) {
            return {
                ...ret,
                [key]: JSON.stringify(data[key])
            }
        }
        return {
            ...ret,
            [key]: data[key]
        }
    }, {})
}

export class SqlSealDatabase {
    db: Comlink.Remote<WorkerDatabase>
    private isConnected = false
    private connectingPromise: Promise<void>;
    constructor(private readonly app: App, private readonly verbose = false) {

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

    async createTableWithData(name: string, data: Array<Record<string, unknown>>) {
        const schema = await this.getSchema(data)
        await this.createTable(name, schema)
        await this.insertData(name, data)

        return schema
    }

    async updateData(name: string, data: Array<Record<string, unknown>>) {
        return this.db.updateData(name, data)
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

    async createTableClean(name: string, fields: Array<FieldDefinition>) {
        const fieldsToRecord = fields.reduce((acc, f) => ({
            ...acc,
            [f.name]: f.type
        }), {} as Record<string, FieldTypes>) as Record<string, FieldTypes>
        await this.createTable(name, fieldsToRecord)
    }

    async createTable(name: string, fields: Record<string, FieldTypes>, noDrop?: boolean) {
        await this.db.createTable(name, fields, noDrop)
    }
    async getSchema(data: Array<Record<string, unknown>>) {
        const fields = Object.keys(data.reduce((acc, obj) => ({ ...acc, ...obj }), {}));
        const { types } = toTypeStatements(fields, data as Array<Record<string, string>>); // Call the toTypeStatements function with the correct arguments
        return types;
    }

    async select(statement: string, frontmatter: Record<string, unknown>) {
        const result = await this.db.select(statement, frontmatter)
        return result
    }
}