import { App } from "obsidian";
import { isLinkLocal } from "./helperFunctions";

export const renderImage = (app: App) => ([href, path]: [string, string]) => {
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