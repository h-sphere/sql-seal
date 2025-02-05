const unidecode = require('unidecode')

/**
 * Sanitizes a string to be used as a valid SQLite column name.
 * Rules implemented:
 * 1. Must start with a letter or underscore
 * 2. Can only contain letters, numbers, and underscores
 * 3. Cannot be a SQLite reserved keyword
 * 4. Maximum length is 128 characters (SQLite's practical limit)
 * 5. Case-insensitive comparison for reserved keywords
 * 
 * @param input The string to sanitize
 * @returns A valid SQLite column name
 */
export function sanitise(input: string): string {
    // List of SQLite keywords that cannot be used as column names
    const SQLITE_KEYWORDS = new Set([
        'ABORT', 'ACTION', 'ADD', 'AFTER', 'ALL', 'ALTER', 'ANALYZE', 'AND', 'AS', 'ASC',
        'ATTACH', 'AUTOINCREMENT', 'BEFORE', 'BEGIN', 'BETWEEN', 'BY', 'CASCADE', 'CASE',
        'CAST', 'CHECK', 'COLLATE', 'COLUMN', 'COMMIT', 'CONFLICT', 'CONSTRAINT', 'CREATE',
        'CROSS', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'DATABASE', 'DEFAULT',
        'DEFERRABLE', 'DEFERRED', 'DELETE', 'DESC', 'DETACH', 'DISTINCT', 'DROP', 'EACH',
        'ELSE', 'END', 'ESCAPE', 'EXCEPT', 'EXCLUSIVE', 'EXISTS', 'EXPLAIN', 'FAIL',
        'FOR', 'FOREIGN', 'FROM', 'FULL', 'GLOB', 'GROUP', 'HAVING', 'IF', 'IGNORE',
        'IMMEDIATE', 'IN', 'INDEX', 'INDEXED', 'INITIALLY', 'INNER', 'INSERT', 'INSTEAD',
        'INTERSECT', 'INTO', 'IS', 'ISNULL', 'JOIN', 'KEY', 'LEFT', 'LIKE', 'LIMIT',
        'MATCH', 'NATURAL', 'NO', 'NOT', 'NOTNULL', 'NULL', 'OF', 'OFFSET', 'ON',
        'OR', 'ORDER', 'OUTER', 'PLAN', 'PRAGMA', 'PRIMARY', 'QUERY', 'RAISE',
        'RECURSIVE', 'REFERENCES', 'REGEXP', 'REINDEX', 'RELEASE', 'RENAME', 'REPLACE',
        'RESTRICT', 'RIGHT', 'ROLLBACK', 'ROW', 'SAVEPOINT', 'SELECT', 'SET',
        'TABLE', 'TEMP', 'TEMPORARY', 'THEN', 'TO', 'TRANSACTION', 'TRIGGER', 'UNION',
        'UNIQUE', 'UPDATE', 'USING', 'VACUUM', 'VALUES', 'VIEW', 'VIRTUAL', 'WHEN',
        'WHERE', 'WITH', 'WITHOUT'
    ]);

    if (!input || typeof input !== 'string') {
        return '_empty';
    }

    const nonAccented = unidecode(input).trim()

    // Replace any character that isn't a letter, number, or underscore with underscore
    let sanitized = nonAccented.replace(/[^a-zA-Z0-9_]/g, '_');

    // Ensure it starts with a letter or underscore
    if (!/^[a-zA-Z_]/.test(sanitized)) {
        sanitized = '_' + sanitized;
    }

    // Truncate to maximum length
    sanitized = sanitized.slice(0, 128);

    // If it's a reserved keyword, append underscore
    if (SQLITE_KEYWORDS.has(sanitized.toUpperCase())) {
        sanitized += '_';
    }

    return sanitized.toLowerCase();
}