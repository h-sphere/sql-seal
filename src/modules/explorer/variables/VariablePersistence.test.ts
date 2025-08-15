import { VariablePersistence } from './VariablePersistence';

describe('VariablePersistence', () => {
    const sampleSql = `SELECT * FROM files 
WHERE name LIKE @searchTerm 
AND size > @minSize`;

    const sampleVariables = {
        searchTerm: '%.txt',
        minSize: '1000'
    };

    const sqlWithVariables = `SELECT * FROM files 
WHERE name LIKE @searchTerm 
AND size > @minSize

-- [SQLSealVariables]
-- {
--   "searchTerm": "%.txt",
--   "minSize": "1000"
-- }
-- [/SQLSealVariables]`;

    describe('extractVariableValues', () => {
        it('should extract variables from content with variable comments', () => {
            const variables = VariablePersistence.extractVariableValues(sqlWithVariables);
            expect(variables).toEqual(sampleVariables);
        });

        it('should return empty object when no variable comments exist', () => {
            const variables = VariablePersistence.extractVariableValues(sampleSql);
            expect(variables).toEqual({});
        });

        it('should handle malformed JSON gracefully', () => {
            const malformedContent = `SELECT * FROM files

-- [SQLSealVariables]
-- { invalid json }
-- [/SQLSealVariables]`;
            
            const variables = VariablePersistence.extractVariableValues(malformedContent);
            expect(variables).toEqual({});
        });

        it('should handle missing end marker', () => {
            const incompleteContent = `SELECT * FROM files

-- [SQLSealVariables]
-- {"test": "value"}`;
            
            const variables = VariablePersistence.extractVariableValues(incompleteContent);
            expect(variables).toEqual({});
        });

        it('should handle multiple variable sections by using the last one', () => {
            const multipleContent = `SELECT * FROM files

-- [SQLSealVariables]
-- {"old": "value"}
-- [/SQLSealVariables]

SELECT * FROM other_table

-- [SQLSealVariables]
-- {"new": "value"}
-- [/SQLSealVariables]`;
            
            const variables = VariablePersistence.extractVariableValues(multipleContent);
            expect(variables).toEqual({ new: 'value' });
        });
    });

    describe('getCleanSqlContent', () => {
        it('should remove variable comments from content', () => {
            const cleanSql = VariablePersistence.getCleanSqlContent(sqlWithVariables);
            expect(cleanSql).toBe(sampleSql);
        });

        it('should return original content when no variable comments exist', () => {
            const cleanSql = VariablePersistence.getCleanSqlContent(sampleSql);
            expect(cleanSql).toBe(sampleSql);
        });

        it('should handle content with only variable comments', () => {
            const onlyComments = `-- [SQLSealVariables]
-- {"test": "value"}
-- [/SQLSealVariables]`;
            
            const cleanSql = VariablePersistence.getCleanSqlContent(onlyComments);
            expect(cleanSql).toBe('');
        });

        it('should handle missing end marker by removing to end of file', () => {
            const incompleteContent = `SELECT * FROM files

-- [SQLSealVariables]
-- {"test": "value"}`;
            
            const cleanSql = VariablePersistence.getCleanSqlContent(incompleteContent);
            expect(cleanSql).toBe('SELECT * FROM files');
        });
    });

    describe('injectVariableValues', () => {
        it('should inject variables into clean SQL content', () => {
            const result = VariablePersistence.injectVariableValues(sampleSql, sampleVariables);
            expect(result).toBe(sqlWithVariables);
        });

        it('should return original content when no variables provided', () => {
            const result = VariablePersistence.injectVariableValues(sampleSql, {});
            expect(result).toBe(sampleSql);
        });

        it('should handle empty SQL content', () => {
            const result = VariablePersistence.injectVariableValues('', sampleVariables);
            expect(result).toContain('-- [SQLSealVariables]');
            expect(result).toContain('-- [/SQLSealVariables]');
        });
    });

    describe('updateVariableValues', () => {
        it('should update existing variable values', () => {
            const newVariables = { searchTerm: '%.pdf', minSize: '2000' };
            const result = VariablePersistence.updateVariableValues(sqlWithVariables, newVariables);
            
            const extractedVars = VariablePersistence.extractVariableValues(result);
            expect(extractedVars).toEqual(newVariables);
            
            const cleanSql = VariablePersistence.getCleanSqlContent(result);
            expect(cleanSql).toBe(sampleSql);
        });

        it('should add variables to content without existing variables', () => {
            const result = VariablePersistence.updateVariableValues(sampleSql, sampleVariables);
            expect(result).toBe(sqlWithVariables);
        });
    });

    describe('hasVariableDefinitions', () => {
        it('should return true when content has variable definitions', () => {
            expect(VariablePersistence.hasVariableDefinitions(sqlWithVariables)).toBe(true);
        });

        it('should return false when content has no variable definitions', () => {
            expect(VariablePersistence.hasVariableDefinitions(sampleSql)).toBe(false);
        });
    });
});