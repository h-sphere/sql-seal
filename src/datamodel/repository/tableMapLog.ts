import { Repository } from "./abstractRepository";
import { v4 as uuid4 } from "uuid";

export interface TableMapLog {
    id: string;
    table_name: string;
    alias_name: string;
    source_file_name: string;
    created_at: string;
    updated_at: string;
}

export class TableMapLogRepository extends Repository {

    async init() {
        await this.createTable()
    }

    async deleteMapping(id: string) {
        this.db.deleteData('table_map_log', [{ id: id }], 'id')
    }

    private async createTable() {
        // FIXME: add autoincrement index here to make it easier to manage.
        await this.db.createTableNoTypes('table_map_log',[
            'id', 'table_name', 'alias_name', 'source_file_name', 'created_at', 'updated_at'
        ], true)
    }

    async insert(log: Omit<TableMapLog, 'id' | 'created_at' | 'updated_at'>) {
        const now = Date.now()
        await this.db.insertData('table_map_log', [{
            id: uuid4(),
            table_name: log.table_name,
            alias_name: log.alias_name,
            source_file_name: log.source_file_name,
            created_at: now,
            updated_at: now
        }])
    }

    async getAll() {
        const { data } = await this.db.select('SELECT * FROM table_map_log', {})
        return data as unknown as TableMapLog[]
    }

    async getByAlias(sourceFileName: string, aliasName: string) {
        const { data } = await this.db.select(`SELECT * FROM table_map_log
            WHERE source_file_name=@source_file_name
                AND alias_name=@alias_name`, {
                    'source_file_name': sourceFileName,
                    'alias_name': aliasName
                })
        if (!data || data.length < 0) {
            return null
        }
        return data[0] as unknown as TableMapLog
    }

    async getByTableName(tableName: string) {
        const { data } = await this.db.select(`SELECT * FROM table_map_log
            WHERE table_name = @table_name`, {
                table_name: tableName
        })
        if (!data) {
            return []
        }
        return data as unknown[] as TableMapLog[]
    }


    async getByContext(sourceFileName: string) {
        const { data } = await this.db.select(`SELECT * FROM table_map_log
            WHERE source_file_name=@source_file_name
            `, { source_file_name: sourceFileName })
        if (!data) {
            return []
        }
        return data
    }
}