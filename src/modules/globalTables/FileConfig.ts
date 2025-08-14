import { TFile, Vault } from "obsidian";

export class FileConfig<T> {
    constructor(private path: string, private vault: Vault) {

    }

    private data: T[] = []
    private isLoaded: boolean = false
    private fileHandler: TFile | null = null

    async load() {
        await this.handleMigration();
        
        this.fileHandler = this.vault.getFileByPath(this.path)
        if (!this.fileHandler) {
            return
        }

        // FIXME: add proper ZOD parsing here
        this.data = JSON.parse(await this.vault.cachedRead(this.fileHandler))
        this.isLoaded = true
    }

    private async handleMigration() {
        // Check if current file exists
        this.fileHandler = this.vault.getFileByPath(this.path)
        if (this.fileHandler) {
            return; // Current file exists, no migration needed
        }

        // Check if this is a .sqlsealconfig file and look for old .sqlseal version
        if (this.path.endsWith('.sqlsealconfig')) {
            const oldPath = this.path.replace('.sqlsealconfig', '.sqlseal');
            const oldFile = this.vault.getFileByPath(oldPath);
            
            if (oldFile) {
                // Migrate old file to new extension
                try {
                    await this.vault.rename(oldFile, this.path);
                    console.log(`SQLSeal: Migrated config file from ${oldPath} to ${this.path}`);
                } catch (error) {
                    console.error(`SQLSeal: Failed to migrate config file from ${oldPath} to ${this.path}:`, error);
                }
            }
        }
    }

    async insert(v: T) {
        if (!this.isLoaded) {
            await this.load()
        }
        this.data.push(v)
        await this.save()
    }

    get items() {
        return this.data
    }

    async save() {
        const data = JSON.stringify(this.data)
        if (!this.fileHandler) {
            // Creating new file
            this.fileHandler = await this.vault.create(this.path, data)
            return
        }
        await this.vault.modify(this.fileHandler, data)
    }

    async remove(v: T) {
        this.data = this.data.filter(d => d !== v)
        await this.save()
    }
}