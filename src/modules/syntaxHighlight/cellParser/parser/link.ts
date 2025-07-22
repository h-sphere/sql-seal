import { isStringifiedArray, renderStringifiedArray } from "../../../../utils/ui";
import { isLinkLocal, isLinktext, removeExtension } from "../../../../utils/ui/helperFunctions";
import { CellFunction } from "../CellFunction";
import { App } from "obsidian";

type Args = [string] | [string, string]

export class LinkParser implements CellFunction<Args> {

    constructor(private readonly app: App, private readonly create = createEl) { }

    get name(): string {
        return 'a'
    }

    get sqlFunctionArgumentsCount() {
        return 2 // FIXME: should it be 1 or 2?
    }

    parseLink(href: string, name?: string) {
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

        return {
            name, href, cls
        }
    }

    prepare([href, name]: Args) {
        if (!href) {
            return ''
        }

        if (isStringifiedArray(href)) {
            try {
                // FIXME: this return should work differently
                renderStringifiedArray(href, href => this.prepare([href]))
            } catch (e) {
                return href
            }
        }
        const res = this.parseLink(href, name)
        const el = this.create('a', { text: res.name, href: res.href, cls: res.cls })
        return el
    }

    renderAsString([href, name]: Args): string {
        if (!href) {
            return ''
        }
       const res = this.parseLink(href, name)
       if (res.cls == 'internal-link') {
            if (!name) {
                return `[[${res.href}]]`
            }
            return `[[${res.href}|${res.name}]]`
       } else {
        return `[${res.name}](${res.href})`
       }
    }
}