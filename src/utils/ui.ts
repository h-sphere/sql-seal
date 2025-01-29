import { App } from "obsidian"
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
    if (isLinkLocal(href)) {
        let fileHref = href
        if (fileHref.endsWith('.md')) {
            fileHref = fileHref.slice(0, -3)
        }
        const vaultName = encodeURIComponent((app as any).appId);
        const encodedPath = encodeURIComponent(fileHref);
        href = `obsidian://open?vault=${vaultName}&file=${encodedPath}`;
    }
    const el = createEl('a', { text: name, href: href })
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