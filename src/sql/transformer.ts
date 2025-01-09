import { Parser } from 'node-sql-parser';

export function transformQuery(query: string, tablesAliases: Record<string, string>): string {
  const parser = new Parser();
  
  // Parse the query into an AST
  const ast = parser.astify(query, {
    database: 'Sqlite'
  });
  
  // Handle both single queries and multiple queries (like UNION)
  const queries = Array.isArray(ast) ? ast : [ast];
  
  // Process each query in the array
  queries.forEach(queryAst => {
    transformQueryPart(queryAst, tablesAliases);
  });

  // Convert back to SQL
  return parser.sqlify(ast, { database: 'Sqlite' });
}

function transformQueryPart(ast: any, tablesAliases: Record<string, string>): void {
  if (!ast || typeof ast !== 'object') return;

  // Handle FROM clause
  if (ast.from) {
    ast.from = ast.from.map((fromItem: any) => {
      // Handle regular table references
      if (fromItem.table && tablesAliases[fromItem.table]) {
        fromItem.table = tablesAliases[fromItem.table];
      }

      // Handle function expressions in FROM clause (like json_each)
      if (fromItem.expr) {
        transformExpression(fromItem.expr, tablesAliases);
      }

      // Handle nested queries in FROM
      if (fromItem.stmt) {
        transformQueryPart(fromItem.stmt, tablesAliases);
      }

      return fromItem;
    });
  }

  // Handle WITH clause (CTEs)
  if (ast.with && Array.isArray(ast.with)) {
    ast.with.forEach((withItem: any) => {
      if (withItem.stmt) {
        transformQueryPart(withItem.stmt.ast, tablesAliases);
      }
    });
  }

  // Handle legacy WITH clause structure
  if (ast.with && ast.with.ctes && Array.isArray(ast.with.ctes)) {
    ast.with.ctes.forEach((withItem: any) => {
      if (withItem.stmt) {
        transformQueryPart(withItem.stmt, tablesAliases);
      }
    });
  }

  // Handle JOINs
  if (ast.join) {
    ast.join = ast.join.map((joinItem: any) => {
      if (joinItem.table && joinItem.table.table && tablesAliases[joinItem.table.table]) {
        joinItem.table.table = tablesAliases[joinItem.table.table];
      }
      if (joinItem.on) {
        transformExpression(joinItem.on, tablesAliases);
      }
      return joinItem;
    });
  }

  // Handle WHERE clause
  if (ast.where) {
    transformExpression(ast.where, tablesAliases);
  }

  // Handle UNION queries
  if (ast.union) {
    transformQueryPart(ast.union[0], tablesAliases);
    transformQueryPart(ast.union[1], tablesAliases);
  }

  // Handle SELECT columns
  if (ast.columns) {
    ast.columns.forEach((column: any) => {
      transformExpression(column.expr, tablesAliases);
    });
  }
}

function transformExpression(expr: any, tablesAliases: Record<string, string>): void {
  if (!expr || typeof expr !== 'object') return;

  // Handle column references
  if (expr.type === 'column_ref' && expr.table && tablesAliases[expr.table]) {
    expr.table = tablesAliases[expr.table];
  }

  // Handle function calls
  if (expr.type === 'function') {
    if (expr.args && Array.isArray(expr.args)) {
      expr.args.forEach((arg: any) => {
        if (arg.type === 'column_ref' && arg.table && tablesAliases[arg.table]) {
          arg.table = tablesAliases[arg.table];
        }
        transformExpression(arg, tablesAliases);
      });
    }
  }

  // Handle binary expressions
  if (expr.type === 'binary_expr') {
    transformExpression(expr.left, tablesAliases);
    transformExpression(expr.right, tablesAliases);
  }

  // Handle CASE expressions
  if (expr.type === 'case') {
    if (expr.args && Array.isArray(expr.args)) {
      expr.args.forEach((arg: any) => transformExpression(arg, tablesAliases));
    }
  }

  // Recursively process other potential expressions
  Object.keys(expr).forEach(key => {
    if (Array.isArray(expr[key])) {
      expr[key].forEach((item: any) => {
        if (item && typeof item === 'object') {
          transformExpression(item, tablesAliases);
        }
      });
    } else if (expr[key] && typeof expr[key] === 'object') {
      transformExpression(expr[key], tablesAliases);
    }
  });
}
