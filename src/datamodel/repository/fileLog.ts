import { Repository } from "./abstractRepository";
import { v4 as uuidv4 } from "uuid";

export interface FileLog {
    id: string,
    table_name: string,
    file_name: string,
    created_at: string,
    updated_at: string,
    file_hash: string
}

export class FileLogRepository extends Repository {

    async init() {
        await this.createTable()
    }

    private async createTable() {
        await this.db.createTable('file_log', {
            'id': 'TEXT',
            'table_name': 'TEXT',
            'file_name': 'TEXT',
            'created_at': 'TEXT',
            'updated_at': 'TEXT',
            'file_hash': 'TEXT'
        }, true)
    }

    async insert(log: Omit<FileLog, 'id' | 'created_at' | 'updated_at'>) {
        const now = Date.now()
        await this.db.insertData('file_log', [{
            id: uuidv4(),
            table_name: log.table_name,
            file_name: log.file_name,
            file_hash: log.file_hash,
            created_at: now,
            updated_at: now
        }])
    }

    async getByFilename(filename: string) {
        const { data } = await this.db.select('SELECT * FROM file_log WHERE file_name = @filename', {
            filename: filename
        })

        if (!data.length) {
            return null
        }
        return data[0] as unknown as FileLog
    }

    async getAll() {
        const { data } = await this.db.select('SELECT * FROM file_log', {})
        return data as unknown[] as FileLog[];
    }

    async updateHash(tableName: string, newHash: string) {
        await this.db.db.updateData('file_log', [{
            table_name: tableName,
            file_hash: newHash
        }], 'table_name')

    }
}