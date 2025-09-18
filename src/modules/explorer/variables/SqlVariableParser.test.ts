import { SqlVariableParser } from './SqlVariableParser';

describe('SqlVariableParser', () => {
    describe('extractVariables', () => {
        it('should extract single variable from simple query', () => {
            const query = 'SELECT * FROM files WHERE name = @varA';
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual(['varA']);
        });

        it('should extract multiple variables from query', () => {
            const query = 'SELECT * FROM files WHERE name = @varA AND path LIKE @varB';
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual(['varA', 'varB']);
        });

        it('should extract variables and sort them alphabetically', () => {
            const query = 'SELECT * FROM files WHERE name = @zebra AND path = @alpha AND size > @beta';
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual(['alpha', 'beta', 'zebra']);
        });

        it('should handle duplicate variables by deduplicating', () => {
            const query = 'SELECT * FROM files WHERE (name = @varA OR path = @varA) AND size > @varB';
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual(['varA', 'varB']);
        });

        it('should return empty array for query without variables', () => {
            const query = 'SELECT * FROM files WHERE name = "test"';
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual([]);
        });

        it('should handle variables with underscores and numbers', () => {
            const query = 'SELECT * FROM files WHERE name = @var_123 AND path = @test_var_2';
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual(['test_var_2', 'var_123']);
        });

        it('should handle variables in complex queries with CTEs', () => {
            const query = `
                WITH filtered_files AS (
                    SELECT * FROM files 
                    WHERE name LIKE @pattern
                )
                SELECT * FROM filtered_files 
                WHERE size > @minSize AND path = @targetPath
            `;
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual(['minSize', 'pattern', 'targetPath']);
        });

        it('should handle variables in subqueries', () => {
            const query = `
                SELECT * FROM files 
                WHERE id IN (
                    SELECT file_id FROM tags 
                    WHERE tag = @tagName
                ) AND name = @fileName
            `;
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual(['fileName', 'tagName']);
        });

        it('should handle variables in JOIN conditions', () => {
            const query = `
                SELECT f.name, t.tag
                FROM files f
                JOIN tags t ON f.id = t.file_id
                WHERE f.path = @basePath AND t.tag = @filterTag
            `;
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual(['basePath', 'filterTag']);
        });

        it('should handle variables in window functions', () => {
            const query = `
                SELECT name, 
                       ROW_NUMBER() OVER (ORDER BY name) as rn
                FROM files 
                WHERE created_date >= @startDate
            `;
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual(['startDate']);
        });

        it('should handle variables in aggregate functions', () => {
            const query = `
                SELECT COUNT(*) as file_count
                FROM files 
                WHERE size > @minSize
                GROUP BY CASE WHEN size > @largeFileThreshold THEN 'large' ELSE 'small' END
            `;
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual(['largeFileThreshold', 'minSize']);
        });

        it('should ignore @ symbols that are not variables (in strings)', () => {
            const query = `SELECT * FROM files WHERE name = '@notAVariable' AND path = @realVariable`;
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual(['realVariable']);
        });

        it('should handle variables that start with underscore', () => {
            const query = 'SELECT * FROM files WHERE name = @_privateVar AND id = @_id123';
            const variables = SqlVariableParser.extractVariables(query);
            expect(variables).toEqual(['_id123', '_privateVar']);
        });
    });

    describe('hasVariables', () => {
        it('should return true for query with variables', () => {
            const query = 'SELECT * FROM files WHERE name = @varA';
            expect(SqlVariableParser.hasVariables(query)).toBe(true);
        });

        it('should return false for query without variables', () => {
            const query = 'SELECT * FROM files WHERE name = "test"';
            expect(SqlVariableParser.hasVariables(query)).toBe(false);
        });

        it('should return true for query with multiple variables', () => {
            const query = 'SELECT * FROM files WHERE name = @varA AND path = @varB';
            expect(SqlVariableParser.hasVariables(query)).toBe(true);
        });
    });

    describe('createParameterObject', () => {
        it('should create parameter object without @ prefixes', () => {
            const values = { varA: 'testValue', varB: 'anotherValue' };
            const params = SqlVariableParser.createParameterObject(values);
            expect(params).toEqual({
                varA: 'testValue',
                varB: 'anotherValue'
            });
        });

        it('should handle empty values object', () => {
            const values = {};
            const params = SqlVariableParser.createParameterObject(values);
            expect(params).toEqual({});
        });

        it('should handle values with special characters', () => {
            const values = { 
                searchTerm: "test's file", 
                path: '/path/with spaces/file.txt' 
            };
            const params = SqlVariableParser.createParameterObject(values);
            expect(params).toEqual({
                searchTerm: "test's file",
                path: '/path/with spaces/file.txt'
            });
        });
    });
});