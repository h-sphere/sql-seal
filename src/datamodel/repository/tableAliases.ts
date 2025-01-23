import { Repository } from "./abstractRepository";
import { v4 as uuid4 } from "uuid";

export interface TableAlias {
    id: string;
    table_name: string;
    alias_name: string;
    source_file_name: string;
    created_at: string;
    updated_at: string;
}

export class TableAliasesRepository extends Repository {

    private readonly TABLE_NAME = 'TABLE_ALIASES';

    async init() {
        await this.createTable()
    }

    async deleteMapping(id: string) {
        this.db.deleteData(this.TABLE_NAME, [{ id: id }], 'id')
    }

    private async createTable() {
        // FIXME: add autoincrement index here to make it easier to manage.
        await this.db.createTableNoTypes(this.TABLE_NAME,[
            'id', 'table_name', 'alias_name', 'source_file_name', 'created_at', 'updated_at'
        ], true)
    }

    async insert(log: Omit<TableAlias, 'id' | 'created_at' | 'updated_at'>) {
        const now = Date.now()
        await this.db.insertData(this.TABLE_NAME, [{
            id: uuid4(),
            table_name: log.table_name,
            alias_name: log.alias_name,
            source_file_name: log.source_file_name,
            created_at: now,
            updated_at: now
        }])
    }

    async getAll() {
        const { data } = await this.db.select('SELECT * FROM TABLE_ALIASES', {})
        return data as unknown as TableAlias[]
    }

    async getByAlias(sourceFileName: string, aliasName: string) {
        const { data } = await this.db.select(`SELECT * FROM TABLE_ALIASES
            WHERE source_file_name=@source_file_name
                AND alias_name=@alias_name`, {
                    'source_file_name': sourceFileName,
                    'alias_name': aliasName
                })
        if (!data || data.length < 0) {
            return null
        }
        return data[0] as unknown as TableAlias
    }

    async getByTableName(tableName: string) {
        const { data } = await this.db.select(`SELECT * FROM TABLE_ALIASES
            WHERE table_name = @table_name`, {
                table_name: tableName
        })
        if (!data) {
            return []
        }
        return data as unknown[] as TableAlias[]
    }


    async getByContext(sourceFileName: string) {
        const { data } = await this.db.select(`SELECT * FROM TABLE_ALIASES
            WHERE source_file_name=@source_file_name
            `, { source_file_name: sourceFileName })
        if (!data) {
            return []
        }
        return data
    }
}