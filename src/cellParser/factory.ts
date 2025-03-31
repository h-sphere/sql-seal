import { App } from "obsidian"
import { ModernCellParser } from "./ModernCellParser"
import { LinkParser } from "./parser/link"
import { ImageParser } from "./parser/image"
import { CheckboxParser } from "./parser/checkbox"

export const getCellParser = (app: App, create = createEl) => {
    const cellParser = new ModernCellParser()
    cellParser.register(new LinkParser(app, create))
    cellParser.register(new ImageParser(app, create))
    cellParser.register(new CheckboxParser(app, create))
    return cellParser
}