import { isStringifiedArray, renderStringifiedArray } from "../../utils/ui";
import { CellFunction } from "../CellFunction";
import { CellParserResult, Result } from "../ModernCellParser";
import { App } from "obsidian";
import { isLinkLocal, isLinktext, removeExtension } from "src/utils/ui/helperFunctions";

type Args = [string] | [string, string]

export class LinkParser implements CellFunction<Args> {

    constructor(private readonly app: App, private readonly create = createEl) { }

    get name(): string {
        return 'a'
    }

    get sqlFunctionArgumentsCount() {
        return 2 // FIXME: should it be 1 or 2?
    }

    prepare([href, name]: Args) {
        if (!href) {
            return ''
        }

        if (isStringifiedArray(href)) {
            try {
                renderStringifiedArray(href, href => this.prepare([href]))
            } catch (e) {
                return href
            }
        }

        if (!name) {
            name = href
        }
        href = href.trim()
        let cls = ''
        if (isLinktext(href)) {
                const [path, linkName] = href.slice(2, -2).split('|')
                const link = this.app.metadataCache.getFirstLinkpathDest(path, '')
        
                if (name.trim() === href) {
                    name = linkName ?? path
                }
        
                if (!link) {
                    href = path
                } else {
                    href = link.path
                }
                cls = 'internal-link'
        
            } else if (isLinkLocal(href)) {
                let fileHref = href
                if (fileHref.endsWith('.md')) {
                    fileHref = fileHref.slice(0, -3)
                }
                if (name === href) {
                    const components = href.split('/')
                    name = removeExtension(components[components.length - 1])
                }
                cls = 'internal-link'
            }
            const el = this.create('a', { text: name, href, cls })
            return el
    }
}