import { App } from "obsidian"
import { isLinkLocal, isLinktext, removeExtension } from "./helperFunctions"
import { isStringifiedArray, renderStringifiedArray } from "../ui"

type LinkType = [string] | [string, string]

export const renderLink = (app: App, create = createEl) => ([href, name]: LinkType): string | Node => {
    if (!href) {
        return ''
    }

    if (isStringifiedArray(href)) {
        try {
            return renderStringifiedArray(href, href => renderLink(app, create)([href]))
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
        const link = app.metadataCache.getFirstLinkpathDest(path, '')

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
    const el = create('a', { text: name, href, cls })
    return el
}