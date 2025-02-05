import { uniq } from 'lodash';
import { parse, show, cstVisitor } from 'sql-parser-cst';

/**
 * Function transforms SQL query and updates tables into actual names in te database.
 * @param query SQL query string
 * @param tableNames mappings of user-defined values (keys) and actual table names in the database (values)
 * @returns returns object containing new query (sql) and all tables that has been mapped (mappedTables)
 */
export const transformQuery = (query: string, tableNames: Record<string, string>) => {
  const cst = parse(query, {
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