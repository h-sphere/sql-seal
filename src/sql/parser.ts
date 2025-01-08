import { Parser } from 'node-sql-parser';

export interface TransformationConfig {
  excludedTables: Set<string>;
  customTransforms?: {
    [tableName: string]: (contextId: string) => string;
  };
}

export class SQLContextTransformer {
  private parser: Parser;
  private config: TransformationConfig;
  private contextId: string = '';
  private cteNames: Set<string> = new Set();

  constructor(config: TransformationConfig) {
    this.parser = new Parser();
    this.config = config;
  }

  transformQuery(sql: string, contextId: string): string {
    try {
      this.contextId = contextId;
      this.cteNames.clear(); // Reset CTE names for new query
      const ast = this.parser.astify(sql);
      
      // First pass: collect CTE names
      this.collectCTENames(ast);
      
      // Second pass: transform the AST
      const transformedAst = this.transformNode(ast);
      
      return this.parser.sqlify(transformedAst);
    } catch (error) {
      console.error('Error in transformQuery:', error);
      throw error;
    }
  }

  private collectCTENames(node: any) {
    if (!node) return;

    // Handle WITH clause
    if (node.with && Array.isArray(node.with)) {
      node.with.forEach((cte: any) => {
        if (cte.name) {
          this.cteNames.add(cte.name);
        }
      });
    }

    // Recursively collect from all branches
    if (Array.isArray(node)) {
      node.forEach(item => this.collectCTENames(item));
      return;
    }

    if (typeof node === 'object') {
      Object.values(node).forEach(value => this.collectCTENames(value));
    }
  }

  private transformNode(node: any): any {
    if (!node) return node;

    // Handle arrays
    if (Array.isArray(node)) {
      return node.map(item => this.transformNode(item));
    }

    // If not an object, return as is
    if (typeof node !== 'object') {
      return node;
    }

    // Clone the node to avoid mutations
    let transformedNode = { ...node };

    // Handle WITH clause
    if (transformedNode.with && Array.isArray(transformedNode.with)) {
      transformedNode.with = this.transformWithClause(transformedNode.with);
    }

    // Handle FROM clause
    if (transformedNode.type === 'from') {
      transformedNode = this.handleFromClause(transformedNode);
    }
    
    // Handle SELECT statement
    if (transformedNode.type === 'select') {
      if (transformedNode.from) {
        transformedNode.from = this.handleFromClause(transformedNode.from);
      }
      
      // Handle joins
      if (transformedNode.join) {
        transformedNode.join = transformedNode.join.map((joinClause: any) => ({
          ...joinClause,
          table: this.handleFromClause(joinClause.table)
        }));
      }
    }

    // Recursively transform all properties
    for (const [key, value] of Object.entries(transformedNode)) {
      if (key !== 'from' && key !== 'table' && key !== 'with') {
        transformedNode[key] = this.transformNode(value);
      }
    }

    return transformedNode;
  }

  private transformWithClause(withClause: any[]): any[] {
    return withClause.map(cte => ({
      ...cte,
      name: `${this.contextId}_${cte.name}`,
      stmt: this.transformNode(cte.stmt)
    }));
  }

  private handleFromClause(node: any): any {
    if (!node) return node;
    
    if (Array.isArray(node)) {
      return node.map(item => this.handleFromClause(item));
    }

    if (node.table) {
      return this.transformTableRef(node);
    }

    return node;
  }

  private transformTableRef(node: any): any {
    const tableName = node.table;
    if (!tableName) return node;

    // Clone the node
    const transformed = { ...node };

    // Don't transform excluded tables
    if (this.config.excludedTables.has(tableName)) {
      return transformed;
    }

    // Check if it's a CTE reference
    if (this.cteNames.has(tableName)) {
      transformed.table = `${this.contextId}_${tableName}`;
      return transformed;
    }

    // Apply custom transformation if available
    if (this.config.customTransforms?.[tableName]) {
      transformed.table = this.config.customTransforms[tableName](this.contextId);
      return transformed;
    }

    // Default transformation
    transformed.table = `${this.contextId}_${tableName}`;
    return transformed;
  }
}