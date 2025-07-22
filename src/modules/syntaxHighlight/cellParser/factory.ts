import { App } from "obsidian"
import { ModernCellParser } from "./ModernCellParser"
import { LinkParser } from "./parser/link"
import { ImageParser } from "./parser/image"
import { CheckboxParser } from "./parser/checkbox"
import { makeInjector } from "@hypersphere/dity"
import { MainModule } from "../../main/module"
import { SqlSealDatabase } from "../../database/database"

export const getCellParser = (app: App, create = createEl) => {
    const cellParser = new ModernCellParser()
    cellParser.register(new LinkParser(app, create))
    cellParser.register(new ImageParser(app, create))
    cellParser.register(new CheckboxParser(app, create))
    return cellParser
}

// FIXME: inject createEl
@(makeInjector<MainModule>()([
    'obsidian.app',
    'db.db'
]))
export class CellParserFactory {
    make(app: App, db: SqlSealDatabase, create: typeof createEl = createEl) {
        const cellParser = new ModernCellParser()
        cellParser.register(new LinkParser(app, create))
        cellParser.register(new ImageParser(app, create))
        cellParser.register(new CheckboxParser(app, create))
        cellParser.registerDbFunctions(db)
        return cellParser
    }
}