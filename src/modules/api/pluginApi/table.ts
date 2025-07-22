import { SqlSealDatabase } from "../../database/database"

type Item<Columns extends string[]> = Record<Columns[number], string | number | undefined>

export class DatabaseTable<const Columns extends string[]> {
    constructor(private readonly db: SqlSealDatabase ,public readonly tableName: string, private columns: Columns) {

    }

    async connect(): Promise<void> {
        await this.db.connect()
        await this.db.createTableNoTypes(this.tableName, this.columns, true)
    }

    async getAll() {
        const data = await this.db.select(`SELECT * FROM ${this.tableName}`, {})
        if (!data) {
            return []
        }
        return data.data as Item<Columns>[]
    }

    async getByKey(key: Columns[number], value: string | number) {
        const data = await this.db.select(`SELECT * FROM ${this.tableName} WHERE ${key}=@value`, { '@value': value })
        if (!data) {
            return []
        }
        return data.data as Item<Columns>[]
    }

    async insert(data: Partial<Item<Columns>>) {
        await this.db.insertData(this.tableName, [data])
    }

    async delete(key: Columns[number], value: string | number) {
        await this.db.deleteData(this.tableName, [{ [key]: value }], key)
    }

    async update(name: string, data: Record<Columns[number], unknown>, key: string = 'id') {
        this.db.updateData(name, [data], key)
    }


}