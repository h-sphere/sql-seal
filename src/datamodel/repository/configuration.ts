import { Repository } from "./abstractRepository";

export class ConfigurationRepository extends Repository {
    async init() {
        await this.createTable()
    }

    private async createTable() {
        await this.db.createTableNoTypes('configuration', ['id', 'value'], true)
    }

    public async getConfig(key: string) {
        try {
            const config = (await this.db.select('SELECT value FROM configuration WHERE id = @id', { id: key }))!
            if (config.data && config.data.length) {
                return config.data[0].value
            }
            throw new Error(`Configuration value not found for key: ${key}`)
        } catch (e) {
            throw e
        }
    }

    public async setConfig(key: string, value: number | string) {
       await this.db.deleteData('configuration', [{ id: key }], 'id')
       await this.db.insertData('configuration', [{ id: key, value }])
    }
}