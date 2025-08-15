/**
 * Utility class for persisting variable values in SQL file comments
 * Variables are stored as hidden comments at the end of the file
 */
export class VariablePersistence {
    private static readonly COMMENT_MARKER = '-- [SQLSealVariables]';
    private static readonly COMMENT_END_MARKER = '-- [/SQLSealVariables]';

    /**
     * Extract variable values from SQL file content
     * @param content - The full SQL file content
     * @returns Object mapping variable names to their values
     */
    static extractVariableValues(content: string): Record<string, string> {
        
        const markerIndex = content.lastIndexOf(this.COMMENT_MARKER);
        if (markerIndex === -1) {
            return {};
        }

        const endMarkerIndex = content.indexOf(this.COMMENT_END_MARKER, markerIndex);
        if (endMarkerIndex === -1) {
            return {};
        }

        const variableSection = content.substring(
            markerIndex + this.COMMENT_MARKER.length,
            endMarkerIndex
        ).trim();

        try {
            // Remove comment prefixes to get clean JSON
            const cleanJson = variableSection
                .split('\n')
                .map(line => line.replace(/^--\s?/, '').trim())
                .filter(line => line.length > 0)
                .join('\n');

            const variables = JSON.parse(cleanJson);
            return variables;
        } catch (error) {
            console.warn('[SQLSeal Variables] Failed to parse variable JSON:', error);
            return {};
        }
    }

    /**
     * Get SQL content without the variable comment section
     * @param content - The full SQL file content
     * @returns SQL content with variable comments removed
     */
    static getCleanSqlContent(content: string): string {
        const markerIndex = content.lastIndexOf(this.COMMENT_MARKER);
        if (markerIndex === -1) {
            return content;
        }

        // Find the end marker or end of file
        const endMarkerIndex = content.indexOf(this.COMMENT_END_MARKER, markerIndex);
        if (endMarkerIndex === -1) {
            // If no end marker, remove from marker to end of file
            return content.substring(0, markerIndex).trimEnd();
        }

        // Remove the entire variable section including end marker
        const beforeVariable = content.substring(0, markerIndex);
        const afterVariable = content.substring(endMarkerIndex + this.COMMENT_END_MARKER.length);
        
        return (beforeVariable + afterVariable).trim();
    }

    /**
     * Inject variable values into SQL content as comments
     * @param sqlContent - The clean SQL content (without existing variable comments)
     * @param variables - Object mapping variable names to their values
     * @returns SQL content with variable comments appended
     */
    static injectVariableValues(sqlContent: string, variables: Record<string, string>): string {
        if (Object.keys(variables).length === 0) {
            return sqlContent;
        }


        const variableJson = JSON.stringify(variables, null, 2);
        // Format JSON with comment prefixes for each line
        const commentedJson = variableJson
            .split('\n')
            .map(line => line ? `-- ${line}` : '--')
            .join('\n');
        
        const variableComment = `\n\n${this.COMMENT_MARKER}\n${commentedJson}\n${this.COMMENT_END_MARKER}`;
        
        return sqlContent.trimEnd() + variableComment;
    }

    /**
     * Update variable values in existing SQL content
     * @param content - The full SQL file content
     * @param variables - Object mapping variable names to their values
     * @returns Updated SQL content with new variable values
     */
    static updateVariableValues(content: string, variables: Record<string, string>): string {
        const cleanContent = this.getCleanSqlContent(content);
        return this.injectVariableValues(cleanContent, variables);
    }

    /**
     * Check if content contains variable definitions
     * @param content - The SQL file content
     * @returns True if content has variable definitions
     */
    static hasVariableDefinitions(content: string): boolean {
        return content.includes(this.COMMENT_MARKER);
    }
}