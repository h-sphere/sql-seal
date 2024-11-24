import { App } from "obsidian"
import { createGrid, GridOptions } from 'ag-grid-community';
import { themeQuartz } from '@ag-grid-community/theming';

export  const displayNotice = (el: HTMLElement, text: string) => {
    el.empty()
    el.createDiv({ text: text, cls: 'sqlseal-notice' })
}

export  const displayError= (el: HTMLElement, text: string) => {
    el.empty()
    el.createDiv({ text: text, cls: 'sqlseal-error' })
}

export const parseCell = (data: string, app: App) => {
    if (data && typeof data === 'string' && data.startsWith('SQLSEALCUSTOM')) {
        const parsedData = JSON.parse(data.slice('SQLSEALCUSTOM('.length, -1))
        return renderSqlSealCustomElement(parsedData, app)
    }
    return data
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
        const link = createEl('a', {
            text: config.name,
            cls: 'internal-link' // This class is used by Obsidian for internal links
          });
          
          link.addEventListener('click', (event) => {
            event.preventDefault();
            
            // Open the file in the active leaf (same tab)
            const leaf = app.workspace.getLeaf();
            const file = app.vault.getFileByPath(config.href)
            if (!file) {
                return
            }
            leaf.openFile(file);
          });
        const encodedPath = encodeURIComponent(config.href);
        // Create the Obsidian URI
         href = `app://obsidian.md/${encodedPath}`;
         return link
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