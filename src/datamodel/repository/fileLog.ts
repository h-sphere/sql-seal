import { SourceType } from "src/grammar/newParser";
import { Repository } from "./abstractRepository";
import { v4 as uuidv4 } from "uuid";

export interface FileLog {
    id: string,
    table_name: string,
    file_name: string,
    created_at: string,
    updated_at: string,
    file_hash: string,
    type: SourceType,
    extras: Record<string, string>
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
            'file_hash': 'TEXT',
            'type': 'TEXT',
            extras: 'TEXT'
        }, true)
    }

    async insert(log: Omit<FileLog, 'id' | 'created_at' | 'updated_at'>) {
        const now = Date.now()
        await this.db.insertData('file_log', [{
            id: uuidv4(),
            table_name: log.table_name,
            file_name: log.file_name,
            file_hash: log.file_hash,
            type: log.type,
            extras: JSON.stringify(log.extras ?? {}),
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
        const d = data[0]
        return {
            ...d,
            type: d.type ?? 'file',
            extras: JSON.parse(d.extras ? d.extras.toString() :  '{}')
        } as FileLog
    }

    async getAll() {
        const { data } = await this.db.select('SELECT * FROM file_log', {})
        return data.map(d => ({
            ...d,
            type: d.type ?? 'file',
            extras: JSON.parse(d.extras ? d.extras.toString() : '{}')
        })) as FileLog[]
    }

    async updateHash(tableName: string, newHash: string) {
        await this.db.db.updateData('file_log', [{
            table_name: tableName,
            file_hash: newHash
        }], 'table_name')

    }
}