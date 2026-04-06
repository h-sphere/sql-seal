import { transformQuery, rewriteTagsMacro, autoDetectTagAndPattern } from './sqlTransformer'


describe('SQL Transformer', () => {
    it('should properly transform basic SQL query', () => {
        const transformed = transformQuery('SELECT * FROM x', { x: 'file_123' })
        expect(transformed.sql).toEqual('SELECT * FROM file_123')
        expect(transformed.mappedTables).toEqual(['file_123'])
    })

    it('should properly transform SQL with CTE', () => {
        const transformed = transformQuery('WITH v AS (SELECT * FROM x) SELECT * FROM v, x', { x: 'y' })
        expect(transformed.sql).toEqual("WITH v AS (SELECT * FROM y) SELECT * FROM v, y")
        expect(transformed.mappedTables).toEqual(['y'])
    })

    it('should properly persist table functions like json_each', () => {
        const transformed = transformQuery(`SELECT y.name, x.value
FROM y, json_each(y.list) as x
WHERE list IS NOT NULL`, { y: 'file_123' })

        expect(transformed).toEqual({
            sql: `SELECT file_123.name, x.value
FROM file_123, json_each(file_123.list) as x
WHERE list IS NOT NULL`,
            mappedTables: ['file_123']
        })
    })

    it('should properly transform window function', () => {
        const input = `WITH RECURSIVE
numbers AS (
SELECT 1 AS num
UNION ALL
SELECT num + 1
FROM numbers
WHERE num < 10
)
SELECT
num,
SUM(num) OVER (ORDER BY num) AS running_total
FROM
numbers`

        expect(transformQuery(input, { files: 'files' })).toEqual({
            sql: input,
            mappedTables: []
        })
    })

    it('should properly transform query with parameters', () => {
        const input = `WITH data(a) AS (
\tVALUES(1),(2),(3),(5),(6),(7)
)
SELECT * FROM data WHERE a >= @test`

        expect(transformQuery(input, { files: 'files' })).toEqual({
            sql: input,
            mappedTables: []
        })
    })
})

// ---------------------------------------------------------------------------
// TAGS() macro — rewrites multi-tag AND queries into INTERSECT subqueries
// ---------------------------------------------------------------------------

describe('rewriteTagsMacro', () => {
    it('rewrites a single tag to one IN subquery', () => {
        const result = rewriteTagsMacro("SELECT * FROM files WHERE TAGS('#project')")
        expect(result).toBe(
            "SELECT * FROM files WHERE path IN (SELECT path FROM tags WHERE tag = '#project')"
        )
    })

    it('rewrites two tags to INTERSECT subquery', () => {
        const result = rewriteTagsMacro("SELECT * FROM files WHERE TAGS('#project', '#active')")
        expect(result).toBe(
            "SELECT * FROM files WHERE path IN (SELECT path FROM tags WHERE tag = '#project' INTERSECT SELECT path FROM tags WHERE tag = '#active')"
        )
    })

    it('rewrites three tags to three-way INTERSECT', () => {
        const result = rewriteTagsMacro("WHERE TAGS('#a', '#b', '#c')")
        expect(result).toBe(
            "WHERE path IN (SELECT path FROM tags WHERE tag = '#a' INTERSECT SELECT path FROM tags WHERE tag = '#b' INTERSECT SELECT path FROM tags WHERE tag = '#c')"
        )
    })

    it('rewrites TAGS() with no arguments to TRUE (no-op filter)', () => {
        expect(rewriteTagsMacro('SELECT * FROM files WHERE TAGS()')).toBe(
            'SELECT * FROM files WHERE TRUE'
        )
    })

    it('is case-insensitive — lowercase tags() is also rewritten', () => {
        const result = rewriteTagsMacro("SELECT * FROM files WHERE tags('#project')")
        expect(result).toContain("path IN (SELECT path FROM tags WHERE tag = '#project')")
    })

    it('preserves other WHERE conditions alongside TAGS()', () => {
        const result = rewriteTagsMacro("SELECT * FROM files WHERE TAGS('#project') AND name LIKE '%note%'")
        expect(result).toContain("path IN (SELECT path FROM tags WHERE tag = '#project')")
        expect(result).toContain("AND name LIKE '%note%'")
    })

    it('leaves SQL without TAGS() unchanged', () => {
        const sql = "SELECT * FROM files WHERE name = 'hello'"
        expect(rewriteTagsMacro(sql)).toBe(sql)
    })
})

// ---------------------------------------------------------------------------
// autoDetectTagAndPattern — transparently rewrites tag='X' AND tag='Y'
// ---------------------------------------------------------------------------

describe('autoDetectTagAndPattern', () => {
    it('rewrites two tag conditions joined by AND into INTERSECT', () => {
        const sql = "SELECT * FROM files WHERE tag = '#a' AND tag = '#b'"
        const result = autoDetectTagAndPattern(sql)
        expect(result).toContain("path IN (SELECT path FROM tags WHERE tag = '#a' INTERSECT SELECT path FROM tags WHERE tag = '#b')")
    })

    it('rewrites three tag conditions into three-way INTERSECT', () => {
        const sql = "SELECT * FROM files WHERE tag = '#a' AND tag = '#b' AND tag = '#c'"
        const result = autoDetectTagAndPattern(sql)
        expect(result).toContain("path IN (SELECT path FROM tags WHERE tag = '#a' INTERSECT SELECT path FROM tags WHERE tag = '#b' INTERSECT SELECT path FROM tags WHERE tag = '#c')")
    })

    it('accepts both tag and tags.tag column references', () => {
        const sql = "SELECT * FROM files WHERE tags.tag = '#a' AND tag = '#b'"
        const result = autoDetectTagAndPattern(sql)
        expect(result).toContain('INTERSECT')
    })

    it('preserves non-tag conditions in mixed AND chains', () => {
        const sql = "SELECT * FROM files WHERE tag = '#a' AND tag = '#b' AND name = 'test'"
        const result = autoDetectTagAndPattern(sql)
        expect(result).toContain("path IN (SELECT path FROM tags WHERE tag = '#a' INTERSECT SELECT path FROM tags WHERE tag = '#b')")
        expect(result).toContain("name = 'test'")
    })

    it('leaves a single tag condition unchanged (no AND needed)', () => {
        const sql = "SELECT * FROM files WHERE tag = '#a'"
        expect(autoDetectTagAndPattern(sql)).toBe(sql)
    })

    it('leaves OR-joined tag conditions unchanged', () => {
        const sql = "SELECT * FROM files WHERE tag = '#a' OR tag = '#b'"
        expect(autoDetectTagAndPattern(sql)).toBe(sql)
    })

    it('leaves SQL without tag conditions unchanged', () => {
        const sql = "SELECT * FROM files WHERE name = 'hello'"
        expect(autoDetectTagAndPattern(sql)).toBe(sql)
    })

    it('returns original SQL when parsing fails', () => {
        const invalid = 'this is not valid SQL @@##'
        expect(autoDetectTagAndPattern(invalid)).toBe(invalid)
    })
})

// ---------------------------------------------------------------------------
// transformQuery — TAGS() macro integration
// ---------------------------------------------------------------------------

describe('transformQuery — TAGS() macro integration', () => {
    it('applies the TAGS() rewrite then runs normal table-name mapping', () => {
        const result = transformQuery(
            "SELECT * FROM files WHERE TAGS('#project')",
            { files: 'files_vault_abc' }
        )
        expect(result.sql).toContain('FROM files_vault_abc')
        expect(result.sql).toContain("path IN (SELECT path FROM tags WHERE tag = '#project')")
    })

    it('TAGS() with two tags produces an INTERSECT subquery in the final SQL', () => {
        const result = transformQuery(
            "SELECT * FROM files WHERE TAGS('#project', '#status/backlog')",
            {}
        )
        expect(result.sql).toContain('INTERSECT')
        expect(result.sql).toContain("tag = '#project'")
        expect(result.sql).toContain("tag = '#status/backlog'")
    })

    it('auto-detects tag AND pattern and rewrites it', () => {
        const result = transformQuery(
            "SELECT * FROM files WHERE tag = '#project' AND tag = '#active'",
            {}
        )
        expect(result.sql).toContain('INTERSECT')
    })

    it('disableTagAutoDetection option suppresses auto-detection', () => {
        const result = transformQuery(
            "SELECT * FROM files WHERE tag = '#project' AND tag = '#active'",
            {},
            { disableTagAutoDetection: true }
        )
        // Should NOT rewrite — keep original AND pattern
        expect(result.sql).not.toContain('INTERSECT')
        expect(result.sql).toContain("tag = '#project'")
        expect(result.sql).toContain("tag = '#active'")
    })
})
