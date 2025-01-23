import { Repository } from "./abstractRepository";
import { v4 as uuidv4 } from "uuid";

export interface TableDefinition {
    id: string,
    table_name: string,
    source_file: string,
    created_at: string,
    updated_at: string,
    file_hash: string,
    type: string,
    refresh_id: string, // FIXME: we probably don't need this one, it is all solved on the table_name level.
    arguments: string[]
}

const parseDbEntry = (entry: TableDefinition): TableDefinition => ({
    ...entry,
    arguments: JSON.parse(entry.arguments ? entry.arguments.toString() : '[]')
})

export type TableDefinitionExternal = Omit<TableDefinition, 'id' | 'created_at' | 'updated_at'>

export class TableDefinitionsRepository extends Repository {
    private readonly TABLE_NAME = 'TABLE_DEFINITIONS';

    async init() {
        await this.createTable()
    }

    private async createTable() {
        await this.db.createTableNoTypes(
            this.TABLE_NAME, 
            ['id', 'table_name', 'source_file', 'created_at', 'updated_at', 'file_hash', 'type', 'refresh_id', 'arguments'], 
            true
        )
    }

    async insert(definition: TableDefinitionExternal) {
        const now = Date.now()
        await this.db.insertData(this.TABLE_NAME, [{
            id: uuidv4(),
            table_name: definition.table_name,
            source_file: definition.source_file,
            file_hash: definition.file_hash,
            type: definition.type,
            refresh_id: definition.refresh_id,
            arguments: JSON.stringify(definition.arguments ?? []),
            created_at: now,
            updated_at: now
        }])
    }

    async getBySourceFile(sourceFile: string) {
        const { data } = await this.db.select(
            `SELECT * FROM ${this.TABLE_NAME} WHERE source_file = @sourceFile`, 
            { sourceFile }
        )

        if (!data.length) {
            return null
        }
        return (data as unknown[] as TableDefinition[]).map(parseDbEntry)
    }

    async getByRefreshId(refreshId: string) {
        const { data } = await this.db.select(
            `SELECT * FROM ${this.TABLE_NAME} WHERE refresh_id= @refreshId`, 
            { refreshId }
        )

        if (!data.length) {
            return null
        }
        const d = data[0]
        return {
            ...d,
            arguments: JSON.parse(d.arguments ? d.arguments.toString() : '[]')
        } as TableDefinition 
    }

    async getAll() {
        const { data } = await this.db.select(`SELECT * FROM ${this.TABLE_NAME}`, {})
        return data.map(d => ({
            ...d,
            type: d.type ?? 'file',
            arguments: JSON.parse(d.arguments ? d.arguments.toString() : '[]')
        })) as TableDefinition[]
    }

    async update(id: string, fields: Partial<TableDefinitionExternal>) {
        const updateData: Record<string, unknown> = {
            ...fields,
            updated_at: Date.now().toString()
        };

        // Handle arguments field if it exists in the update
        if ('arguments' in fields) {
            updateData.arguments = JSON.stringify(fields.arguments);
        }

        await this.db.db.updateData(this.TABLE_NAME, [{
            id,
            ...updateData
        }], 'id')
    }
}