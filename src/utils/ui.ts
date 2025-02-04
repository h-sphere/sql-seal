import { App, getLinkpath, parseLinktext } from "obsidian"
import { CellParserRegistar } from "src/cellParser"

export  const displayNotice = (el: HTMLElement, text: string) => {
    el.empty()
    el.createDiv({ text: text, cls: 'sqlseal-notice' })
}

export  const displayError = (el: HTMLElement, text: string) => {
    el.empty()
    el.createDiv({ text: text, cls: 'sqlseal-error' })
}

const isLinkLocal = (link: string) => !link?.trim().startsWith('http')

const isLinktext = (link: string) => link.startsWith('[[') && link.endsWith(']]')


const renderCheckbox = (app: App) => ([value]: [string]) => {
    const el = createEl('input', {
        type: 'checkbox',
        attr: {
            disabled: true
        },
    })
    if (!!value) {
        el.checked = true
    }
    return el
}
const renderLink = (app: App) => ([name, href]: [string, string]) => {
    if (!href) {
        href = name
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
        href = href
        cls = 'internal-link'
    }
    const el = createEl('a', { text: name, href, cls })
    return el
}

const renderImage = (app: App) => ([href, path]: [string, string]) => {
    if (!isLinkLocal(href)) {
        return createEl('img', { attr: { src: href } });
    }
    href = (href ?? '').trim()
    if (href.startsWith('![[')) {
        href = href.slice(3, -2)
    }
    let parentPath = ''
    if (path) {
        const parent = app.vault.getFileByPath(path)
        if (parent) {
            parentPath = parent.parent?.path ?? ''
        }
    }
    path = (path ? parentPath + '/' : '') + href
    const file = app.vault.getFileByPath(path);
    if (!file) {
        return 'File does not exist'
    }
    return createEl('img', { attr: { src: app.vault.getResourcePath(file) } });
}

export const registerDefaultFunctions = (registar: CellParserRegistar, app: App) => {
    registar.register('checkbox', renderCheckbox(app), 1)
    registar.register('a', renderLink(app), 2)
    registar.register('img', renderImage(app), 2)
}