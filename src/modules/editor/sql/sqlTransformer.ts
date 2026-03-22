import { uniq } from 'lodash';
import { parse, show, cstVisitor } from 'sql-parser-cst';

/**
 * Pre-processes a SQLSeal query by rewriting the TAGS() macro into valid SQL INTERSECT subqueries.
 *
 * The TAGS() macro solves a common user mistake: filtering by multiple tags with AND
 * always returns zero results because a single row in the tags table cannot have two
 * different tag values simultaneously.
 *
 * Usage:
 *   WHERE TAGS('#project', '#active')
 * Becomes:
 *   WHERE path IN (SELECT path FROM tags WHERE tag = '#project' INTERSECT SELECT path FROM tags WHERE tag = '#active')
 */
export function rewriteTagsMacro(sql: string): string {
  return sql.replace(/TAGS\s*\(([^)]*)\)/gi, (_, argsStr: string) => {
    // Extract all single-quoted string arguments
    const tags = [...argsStr.matchAll(/'([^']*)'/g)].map(m => m[1])
    if (tags.length === 0) return 'TRUE'
    if (tags.length === 1) {
      return `path IN (SELECT path FROM tags WHERE tag = '${tags[0]}')`
    }
    return `path IN (${tags.map(tag => `SELECT path FROM tags WHERE tag = '${tag}'`).join(' INTERSECT ')})`
  })
}

/**
 * Recursively flattens a left-associative AND chain into a flat array of leaf nodes.
 */
function flattenAnd(node: any): any[] {
  const opName = typeof node.operator === 'string' ? node.operator : node.operator?.name
  if (node.type === 'binary_expr' && opName === 'AND') {
    return [...flattenAnd(node.left), ...flattenAnd(node.right)]
  }
  return [node]
}

/**
 * If the node is a tag comparison (`tag = '#value'` or `tags.tag = '#value'`),
 * returns the tag value string. Otherwise returns null.
 */
function extractTagValue(node: any): string | null {
  if (node.type !== 'binary_expr' || node.operator !== '=') return null
  const { left, right } = node

  const isTagCol =
    (left.type === 'identifier' && left.name?.toLowerCase() === 'tag') ||
    (left.type === 'member_expr' &&
      left.object?.type === 'identifier' && left.object.name?.toLowerCase() === 'tags' &&
      left.property?.type === 'identifier' && left.property.name?.toLowerCase() === 'tag')

  if (!isTagCol) return null
  if (right.type !== 'string_literal') return null
  return right.value
}

/**
 * Auto-detects the common mistake of `tag = '#a' AND tag = '#b'` (which always returns zero
 * results) and rewrites it to an INTERSECT subquery. Handles mixed conditions too, e.g.
 * `tag = '#a' AND tag = '#b' AND name = 'test'` is correctly preserved as
 * `path IN (...INTERSECT...) AND name = 'test'`.
 *
 * Does nothing if:
 *   - The SQL cannot be parsed
 *   - Fewer than 2 tag comparisons exist in any AND chain
 *   - The TAGS() macro was already used (no tag AND patterns remain)
 */
export function autoDetectTagAndPattern(sql: string): string {
  let parsed: any
  try {
    parsed = parse(sql, {
      dialect: 'sqlite',
      includeSpaces: true,
      includeComments: true,
      includeNewlines: true,
      includeRange: true,
      paramTypes: ['@name']
    })
  } catch {
    return sql // unparseable — leave unchanged
  }

  interface Candidate {
    start: number
    end: number
    tagValues: string[]
    otherRanges: [number, number][]
  }

  const candidates: Candidate[] = []

  const visitor = cstVisitor({
    binary_expr: (node: any) => {
      const opName = typeof node.operator === 'string' ? node.operator : node.operator?.name
      if (opName !== 'AND' || !node.range) return

      const leaves = flattenAnd(node)
      const tagValues: string[] = []
      const otherRanges: [number, number][] = []

      for (const leaf of leaves) {
        const tagVal = extractTagValue(leaf)
        if (tagVal !== null) {
          tagValues.push(tagVal)
        } else if (leaf.range) {
          otherRanges.push([leaf.range[0], leaf.range[1]])
        }
      }

      if (tagValues.length < 2) return

      candidates.push({ start: node.range[0], end: node.range[1], tagValues, otherRanges })
    }
  })

  visitor(parsed)

  if (candidates.length === 0) return sql

  // Keep only the outermost candidates — inner AND subtrees are subsumed by their parents
  const outermost = candidates.filter(c =>
    !candidates.some(other =>
      other !== c && other.start <= c.start && c.end <= other.end
    )
  )

  if (outermost.length === 0) return sql

  // Apply replacements from right to left so earlier positions remain valid
  outermost.sort((a, b) => b.start - a.start)

  let result = sql
  for (const { start, end, tagValues, otherRanges } of outermost) {
    const intersectPart =
      tagValues.length === 1
        ? `path IN (SELECT path FROM tags WHERE tag = '${tagValues[0]}')`
        : `path IN (${tagValues.map(t => `SELECT path FROM tags WHERE tag = '${t}'`).join(' INTERSECT ')})`

    const otherParts = otherRanges.map(([s, e]) => result.slice(s, e).trim())
    const replacement = [intersectPart, ...otherParts].join(' AND ')

    result = result.slice(0, start) + replacement + result.slice(end)
  }

  return result
}

/**
 * Function transforms SQL query and updates tables into actual names in the database.
 * @param query SQL query string
 * @param tableNames mappings of user-defined values (keys) and actual table names in the database (values)
 * @param options optional behaviour flags
 * @returns returns object containing new query (sql) and all tables that has been mapped (mappedTables)
 */
export const transformQuery = (
  query: string,
  tableNames: Record<string, string>,
  options?: { disableTagAutoDetection?: boolean }
) => {
  // Pre-process TAGS() macro before handing off to the CST parser
  let preprocessed = rewriteTagsMacro(query)

  // Auto-detect and rewrite implicit `tag='X' AND tag='Y'` patterns (unless disabled)
  if (!options?.disableTagAutoDetection) {
    preprocessed = autoDetectTagAndPattern(preprocessed)
  }

  const cst = parse(preprocessed, {
    dialect: 'sqlite',
    includeSpaces: true,
    includeComments: true,
    includeNewlines: true,
    paramTypes: ['@name']
  })

  const watchTables: string[] = []

  const tableMapper = cstVisitor({
    identifier: (identifier) => {
      if (tableNames[identifier.name]) {
        const newName = tableNames[identifier.name]
        identifier.name = newName
        identifier.text = newName
        watchTables.push(newName)
      }
    }
  })

  tableMapper(cst)

  return {
    sql: show(cst),
    mappedTables: uniq(watchTables)
  }
}
