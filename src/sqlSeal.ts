import * as Database from "better-sqlite3";
import GrayMatter from "gray-matter";
import { SqlSealDatabase, defineDatabaseFromUrl, instantiateDatabase } from "./database";
import { displayData, displayError, displayInfo } from "./ui";
import { App, MarkdownPostProcessorContext, MarkdownSectionInformation, WorkspaceLeaf } from "obsidian";
import { updateTables } from "./sqlReparseTables";
import { hashString } from "./hash";

export class SqlSeal {
    public db: SqlSealDatabase
    constructor(private readonly app: App, verbose = false) {
        this.db = new SqlSealDatabase(app, verbose)
    }

    async resolveFrontmatter(ctx: MarkdownPostProcessorContext) {
        if (ctx.frontmatter && Object.keys(ctx.frontmatter).length > 0) {
            return ctx.frontmatter as Record<string, any>
        }
        const file = this.app.vault.getFileByPath(ctx.sourcePath)
        if (!file) {
            return null
        }
        const data = await this.app.vault.cachedRead(file)

        const gm = GrayMatter(data)
        const frontmatter = gm.data
        return frontmatter
    }

    getHandler() {
        return async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            const frontmatter = await this.resolveFrontmatter(ctx)
            const prefix = hashString(ctx.sourcePath)
    const regex = /TABLE\s+(.+)\s+=\s+file\(([^)]+)\)/g;
    let match
    while ((match = regex.exec(source)) !== null) {
        const name = match[1];
        const url = match[2];
        this.db.defineDatabaseFromUrl(name, url, prefix)
    }

    const selectRegexp = /SELECT\s+(.*)/g;
    const selectMatch = selectRegexp.exec(source)
    if (selectMatch) {
        try {
            const selectStatement = selectMatch[0]
            const selectUpdated = updateTables(selectStatement, ['files'], prefix)
            const stmt = await this.db.db.prepare(selectUpdated)
            const columns = await stmt.columns().map(column => column.name);
            const data = await stmt.all(frontmatter)
            displayData(el, columns, data)
        } catch (e) {
            if (e instanceof RangeError && Object.keys(ctx.frontmatter).length === 0) {
                displayInfo(el, 'Cannot access frontmatter properties in Live Preview Mode. Switch to Reading Mode to see the results.')
            } else {
                displayError(el, e)
                console.log(e)
            }
        }
    }
        }
    }
}
