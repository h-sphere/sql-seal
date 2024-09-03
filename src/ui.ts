import { App } from "obsidian"

export const displayData = (el: HTMLElement, columns, data, app: App) => {
    el.empty()
    const container = el.createDiv({
        cls: 'sqlseal-table-container'
    })
    const table = container.createEl("table")

    // HEADER
    const header = table.createEl("thead").createEl("tr")
    columns.forEach(c => {
        header.createEl("th", { text: c })
    })

    const body = table.createEl("tbody")
    data.forEach(d => {
        const row = body.createEl("tr")
        columns.forEach(c => {
            row.createEl("td", { text: parseCell(d[c], app) })

        })
    })
}

const parseCell = (data: string, app: App) => {
    console.log('PARSE CELL', data)
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
    href: string
}

type SqlSealCustomElement = SqlSealAnchorElement | SQLSealImgElement;

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
            return createEl('img', { attr: { src: customConfig.href } })
        default:
            return 'Invalid Custom Element'
    }
}

export const displayError = (el: HTMLElement, e: Error) => {
    el.empty()
    const callout = el.createEl("div", { text: e.toString(), cls: 'callout' })
    callout.dataset.callout = 'error'
}

export const displayInfo = (el: HTMLElement, message: string) => {
    el.empty()
    el.childNodes.forEach(c => c.remove())
    const callout = el.createEl("div", { text: message, cls: 'callout' })
    callout.dataset.callout = 'info'
}

export const displayLoader = (el: HTMLElement) => {
    el.empty()
    const loader = el.createEl("div", { cls: 'callout', text: 'Loading SQLSeal database...' })
    loader.dataset.callout = 'info'
}