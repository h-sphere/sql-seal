import { isLinkLocal } from "../../utils/ui/helperFunctions";
import { CellFunction } from "../CellFunction";
import { CellParserResult } from "../ModernCellParser";
import { App } from "obsidian";

type Args = [string] | [string, string]

export class ImageParser implements CellFunction<Args> {

    constructor(private readonly app: App, private readonly create = createEl) { }

    get name(): string {
        return 'img'
    }

    get sqlFunctionArgumentsCount() {
        return 2 // FIXME: should it be 1 or 2?
    }

    getResourcePath(href: string, path?: string) {
        href = (href ?? '').trim()
        if (href.startsWith('![[')) {
            href = href.slice(3, -2)
        }
        let parentPath = ''
        if (path) {
            const parent = this.app.vault.getFileByPath(path)
            if (parent) {
                parentPath = parent.parent?.path ?? ''
            }
        }
        path = (path ? parentPath + '/' : '') + href
        const file = this.app.vault.getFileByPath(path);
        if (!file) {
            throw new Error('File does not exist')
        }
        return this.app.vault.getResourcePath(file)
    }

    prepare([href, path]: Args): CellParserResult {
        if (!isLinkLocal(href)) {
            return createEl('img', { attr: { src: href } });
        }
        try {
           let resourcePath = this.getResourcePath(href, path)
            return this.create('img', { attr: { src: resourcePath } });

        } catch (e) {
            return e
        }
    }

    renderAsString([href, path]: Args): string {
        if (!isLinkLocal(href)) {
            return `![](${href})`
        } else {
            return `![[${href}]]`
        }
    }
}