import { parse, cstVisitor } from 'sql-parser-cst';

/**
 * Utility class for parsing SQL variables from query strings using sql-parser-cst
 * Detects variables in the format @variableName
 */
export class SqlVariableParser {
    /**
     * Extract all unique variables from a SQL query string
     * @param query - The SQL query string
     * @returns Array of unique variable names (without @ prefix)
     */
    static extractVariables(query: string): string[] {
        
        const cst = parse(query, {
            dialect: 'sqlite',
            includeSpaces: true,
            includeComments: true,
            includeNewlines: true,
            paramTypes: ['@name']
        });

        const variables = new Set<string>();

        const variableVisitor = cstVisitor({
            parameter: (param) => {
                // Parameters in sql-parser-cst - use text property
                const paramText = param.text || '';
                
                if (paramText.startsWith('@')) {
                    const varName = paramText.substring(1);
                    variables.add(varName);
                }
            }
        });

        variableVisitor(cst);

        const result = Array.from(variables).sort();
        return result;
    }

    /**
     * Check if a query contains any variables
     * @param query - The SQL query string
     * @returns True if query contains variables
     */
    static hasVariables(query: string): boolean {
        return this.extractVariables(query).length > 0;
    }

    /**
     * Convert user input values to parameter format (without @ prefix)
     * @param values - Map of variable names to their string values
     * @returns Parameter object compatible with frontmatter format
     */
    static createParameterObject(values: Record<string, string>): Record<string, any> {
        const params: Record<string, any> = {};
        
        for (const [key, value] of Object.entries(values)) {
            // Don't add @ prefix - the system will add it automatically
            params[key] = value;
        }
        
        return params;
    }
}