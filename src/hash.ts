import * as crypto from 'crypto';

export const hashString = (path: string) => {
    const hash = crypto.createHash('sha256')
    hash.update(path)
    return hash.digest('hex')
}
export const generatePrefix = (prefix: string, tableName: string) => {
    return `TTT${prefix}_${tableName}`
}