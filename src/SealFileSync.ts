import { App, TAbstractFile } from "obsidian";
import GrayMatter from "gray-matter";
import { SqlSeal } from "./sqlSeal";



async function extractFrontmatterFromFile(file: TAbstractFile) {
    const content = await this.app.vault.read(file);
    const gm = GrayMatter(content)
    return gm.data
}

function fileData(file: TAbstractFile, frontmatter: Record<string, any>) {
    return {
        ...frontmatter,
        path: file.path,
        name: file.name.replace(/\.[^/.]+$/, ""),
        id: file.path
    }
}

export class SealFileSync {
    private currentSchema: Record<string, 'TEXT' | 'INTEGER' | 'REAL'> = {}
    constructor(public readonly app: App, private readonly sqlSeal: SqlSeal) {
        this.app.vault.on('modify', async (file) => {
            console.log('Modified', file)
            const frontmatter = await extractFrontmatterFromFile(file)
            if (this.isFrontmatterSame([frontmatter])) {
                // we need to update the row
                await this.sqlSeal.db.updateData('files', [fileData(file, frontmatter)])
                return
            }
            await this.init()
        })
    }
    async init() {
        const files = this.app.vault.getMarkdownFiles();

        const data = []

        for (const file of files) {
            const frontmatter = await extractFrontmatterFromFile(file)
            data.push(fileData(file, frontmatter))
        }


        const schema = await this.sqlSeal.db.createTableWithData('files', data)
        this.currentSchema = schema
    }

    isFrontmatterSame(newFrontmatter: Array<Record<string, any>>) {
        const newSchema = this.sqlSeal.db.getSchema(newFrontmatter)
        return JSON.stringify(newSchema) === JSON.stringify(this.currentSchema)        

    }
}