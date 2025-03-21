export const isLinkLocal = (link: string) => !link?.trim().startsWith('http')

export const isLinktext = (link: string) => link.startsWith('[[') && link.endsWith(']]')

const RECOGNIZED_EXTENSIONS = ['md', 'csv', 'json', 'json5']

export const removeExtension = (filename: string) => {
    const parts = filename.split('.')
    if (parts.length > 1) {
        const lastPart = parts[parts.length - 1].toLowerCase()
        if (RECOGNIZED_EXTENSIONS.includes(lastPart)) {
            return parts.slice(0, -1).join('.')
        }
    }
    return filename
}