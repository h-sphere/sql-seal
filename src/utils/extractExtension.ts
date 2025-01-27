export function getFileExtension(pathname: string): string | null {
    const parts = pathname.split('.')
    return parts[parts.length - 1].toLowerCase()
}