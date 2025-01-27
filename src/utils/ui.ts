import { App } from "obsidian"

export  const displayNotice = (el: HTMLElement, text: string) => {
    el.empty()
    el.createDiv({ text: text, cls: 'sqlseal-notice' })
}

export  const displayError= (el: HTMLElement, text: string) => {
    el.empty()
    el.createDiv({ text: text, cls: 'sqlseal-error' })
}

export const parseCell = (data: string, app: App) => {
    try {
        if (data && typeof data === 'string' && data.startsWith('SQLSEALCUSTOM')) {
            const parsedData = JSON.parse(data.slice('SQLSEALCUSTOM('.length, -1))
            return renderSqlSealCustomElement(parsedData, app)
        }
        return data
    } catch (e) {
        console.error('Error parsing cell with data:', data, e)
        return createDiv({
            text: 'Parsing error',
            cls: 'sqlseal-parse-error'
        })
    }        
}

type SqlSealAnchorElement = {
    type: 'link',
    href: string,
    name: string
}

type SQLSealImgElement = {
    type: 'img',
    path?: string,
    href: string
}

type SQLSealCheckboxElement = {
    type: 'checkbox',
    value: number
}

type SqlSealCustomElement = SqlSealAnchorElement | SQLSealImgElement | SQLSealCheckboxElement;

const isLinkLocal = (link: string) => !link?.trim().startsWith('http')

const generateLink = (config: SqlSealAnchorElement, app: App) => {
    let href = config.href
    if (isLinkLocal(config.href)) {
        let fileHref = config.href
        if (fileHref.endsWith('.md')) {
            fileHref = fileHref.slice(0, -3)
        }
        const vaultName = encodeURIComponent((app as any).appId);
        const encodedPath = encodeURIComponent(fileHref);
        href = `obsidian://open?vault=${vaultName}&file=${encodedPath}`;
    }
    const el = createEl('a', { text: config.name, href: href })
    return el
}

const renderSqlSealCustomElement = (customConfig: SqlSealCustomElement, app: App) => {
    switch (customConfig.type) {
        case 'link':
            return generateLink(customConfig, app)
        case 'img':
            if (!isLinkLocal(customConfig.href)) {
                return createEl('img', { attr: { src: customConfig.href } });
            }
            let href = (customConfig.href ?? '').trim()
            if (href.startsWith('![[')) {
                href = href.slice(3, -2)
            }
            let parentPath = ''
            if (customConfig.path) {
                const parent = app.vault.getFileByPath(customConfig.path)
                if (parent) {
                    parentPath = parent.parent?.path ?? ''
                }
            }
            const path = (customConfig?.path ? parentPath + '/' : '') + href
            const file = app.vault.getFileByPath(path);
            if (!file) {
                return 'File does not exist'
            }
            return createEl('img', { attr: { src: app.vault.getResourcePath(file) } });
        case 'checkbox':
            const el = createEl('input', { type: 'checkbox' })
            el.checked = !!customConfig.value
            el.disabled = true
            return el
        default:
            return 'Invalid Custom Element'
    }
}