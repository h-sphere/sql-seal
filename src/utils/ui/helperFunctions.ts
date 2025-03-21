
export const isLinkLocal = (link: string) => !link?.trim().startsWith('http')

export const isLinktext = (link: string) => link.startsWith('[[') && link.endsWith(']]')

export const removeExtension = (filename: string) => {
    const parts = filename.split('.')
    if (parts.length > 1) {
        return parts.slice(0, -1).join('.')
    }
    return filename
}