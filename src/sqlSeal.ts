import * as Database from "better-sqlite3";
import GrayMatter from "gray-matter";
import { SqlSealDatabase, defineDatabaseFromUrl, instantiateDatabase } from "./database";
import { displayData, displayError, displayInfo } from "./ui";
import { App, Editor, MarkdownPostProcessorContext, MarkdownSectionInformation, WorkspaceLeaf } from "obsidian";
import { Parser } from "node-sql-parser";
import { updateTables } from "./sqlReparseTables";
import { hashString } from "./hash";

const EditorLine = (line: number): EditorPosition => ({ line, ch: 0 })
function codeBlockHandler(markdown: string, containerEl: HTMLElement, ctx: MarkdownPostProcessorContext) {
  const leaf: WorkspaceLeaf = app.workspace.rootSplit.children[0].children[0]
  const view: MarkdownView = leaf.view
  const editor: Editor = view.editor

  const sectionInfo: MarkdownSectionInformation = ctx.getSectionInfo()
  const lineStart = EditorLine(sectionInfo.lineStart + 1)
  const lineEnd   = EditorLine(sectionInfo.lineEnd  )

  const text = editor.getRange(lineStart, lineEnd)
  const gm = GrayMatter(text)
  const frontmatter = gm.data
  return frontmatter
}

export class SqlSeal {
    private db: SqlSealDatabase
    constructor(private readonly app: App, verbose = false) {
        this.db = new SqlSealDatabase(app, verbose)
    }

    async resolveFrontmatter(ctx: MarkdownPostProcessorContext) {
        if (ctx.frontmatter && Object.keys(ctx.frontmatter).length > 0) {
            return ctx.frontmatter as Record<string, any>
        }
        console.log('ISSUE WITH FRONTMATTER')
        const file = this.app.vault.getFileByPath(ctx.sourcePath)
        if (!file) {
            console.log('File not found')
            return null
        }
        const data = await this.app.vault.cachedRead(file)
        console.log('DATA', data)

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

    console.log(ctx)

    const selectRegexp = /SELECT\s+(.*)/g;
    const selectMatch = selectRegexp.exec(source)
    if (selectMatch) {
        try {
            const selectStatement = selectMatch[0]
            const selectUpdated = updateTables(selectStatement, [], prefix)
            console.log('UPDATED SELECT:::', selectUpdated)
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


// export const sqlSealHandler = async (source, el, ctx) => {
//     console.log('FRONTMATTER!!!!', ctx)
//     const regex = /TABLE\s+(.+)\s+=\s+file\(([^)]+)\)/g;
//     let match
//     while ((match = regex.exec(source)) !== null) {
//         const name = match[1];
//         const url = match[2];
//         defineDatabaseFromUrl(name, url)
//     }

//     const selectRegexp = /SELECT\s+(.*)/g;
//     const selectMatch = selectRegexp.exec(source)
//     if (selectMatch) {
//         try {
//             const stmt = await db.prepare(selectMatch[0])
//             const columns = await stmt.columns().map(column => column.name);
//             const data = await stmt.all(ctx.frontmatter)
//             displayData
//             (el, columns, data)
//         } catch (e) {
//             displayError(el, e)
//         }
//     }

// }