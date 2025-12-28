import { readFileSync } from 'fs';
import { join } from 'path';
import { MemoryDatabase } from '../memoryDatabase';

// Mock TFile from Obsidian
class MockTFile {
    name: string;
    path: string;
    vault: any;

    constructor(path: string, data: ArrayBuffer) {
        this.name = path.split('/').pop() || 'test.db';
        this.path = path;
        this.vault = {
            readBinary: async (file: any) => data
        };
    }
}

describe('MemoryDatabase with sql.js', () => {
    let memoryDb: MemoryDatabase;
    let testDbBuffer: ArrayBuffer;
    let mockFile: any;

    beforeAll(() => {
        // Load test database
        const testDbPath = join(__dirname, 'test.db');
        testDbBuffer = readFileSync(testDbPath).buffer;
    });

    beforeEach(() => {
        // Create new mock file and MemoryDatabase instance for each test
        mockFile = new MockTFile('test.db', testDbBuffer);
        memoryDb = new MemoryDatabase(mockFile);
    });

    afterEach(async () => {
        if (memoryDb) {
            await memoryDb.disconnect();
        }
    });

    describe('Basic Query Execution', () => {
        test('should execute simple SELECT query', async () => {
            await memoryDb.connect();
            const results = await memoryDb.queryAsync<{ result: number }>('SELECT 1 as result');

            expect(results.columns).toEqual(['result']);
            expect(results.data).toEqual([{ result: 1 }]);
        });

        test('should return empty array for queries with no results', async () => {
            await memoryDb.connect();
            const results = await memoryDb.queryAsync('SELECT * FROM users WHERE id = 999');

            expect(results.data).toEqual([]);
        });

        test('should execute SELECT * FROM users', async () => {
            await memoryDb.connect();
            const results = await memoryDb.queryAsync<{ id: number, name: string, age: number }>('SELECT * FROM users ORDER BY id');

            expect(results.columns).toEqual(['id', 'name', 'age']);
            expect(results.data).toEqual([
                { id: 1, name: 'Alice', age: 30 },
                { id: 2, name: 'Bob', age: 25 }
            ]);
        });
    });

    describe('Schema Queries', () => {
        test('should query sqlite_master for tables', async () => {
            await memoryDb.connect();
            const results = await memoryDb.queryAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'");

            expect(results.columns).toEqual(['name']);
            expect(results.data).toContainEqual({ name: 'users' });
        });

        test('should use PRAGMA table_info', async () => {
            await memoryDb.connect();
            const results = await memoryDb.queryAsync<{ name: string, type: string }>("SELECT name, type FROM pragma_table_info('users')");

            expect(results.columns).toEqual(['name', 'type']);
            expect(results.data).toContainEqual({ name: 'id', type: 'INTEGER' });
            expect(results.data).toContainEqual({ name: 'name', type: 'TEXT' });
            expect(results.data).toContainEqual({ name: 'age', type: 'INTEGER' });
        });
    });

    describe('Parameter Binding', () => {
        test('should handle parameterized queries', async () => {
            await memoryDb.connect();
            const results = await memoryDb.queryAsync<{ id: number, name: string, age: number }>('SELECT * FROM users WHERE id = ?', { id: 1 });

            expect(results.data).toEqual([{ id: 1, name: 'Alice', age: 30 }]);
        });

        test('should handle empty parameter object', async () => {
            await memoryDb.connect();
            const results = await memoryDb.queryAsync('SELECT * FROM users', {});

            expect(results.data).toHaveLength(2);
        });

        test('should handle no parameters (null)', async () => {
            await memoryDb.connect();
            const results = await memoryDb.queryAsync('SELECT * FROM users', null);

            expect(results.data).toHaveLength(2);
        });

        test('should handle no parameters (undefined)', async () => {
            await memoryDb.connect();
            const results = await memoryDb.queryAsync('SELECT * FROM users');

            expect(results.data).toHaveLength(2);
        });
    });

    describe('Data Transformation', () => {
        test('should transform rows to objects', async () => {
            await memoryDb.connect();
            const results = await memoryDb.queryAsync<{ id: number, name: string, age: number }>('SELECT * FROM users ORDER BY id');

            expect(results.data).toEqual([
                { id: 1, name: 'Alice', age: 30 },
                { id: 2, name: 'Bob', age: 25 }
            ]);
        });

        test('should handle empty results when transforming', async () => {
            await memoryDb.connect();
            const results = await memoryDb.queryAsync('SELECT * FROM users WHERE id = 999');

            expect(results.data).toEqual([]);
            expect(results.columns).toEqual([]);
        });
    });

    describe('Realistic MemoryDatabase method calls', () => {
        test('should call allTables() successfully', async () => {
            await memoryDb.connect();
            const results = await memoryDb.allTables();

            expect(results.data.length).toBeGreaterThan(0);
            expect(results.data).toContainEqual({ name: 'users' });
        });

        test('should call getColumns() successfully', async () => {
            await memoryDb.connect();
            const results = await memoryDb.getColumns('users');

            expect(results.data.length).toBe(3);
            expect(results.data).toContainEqual(expect.objectContaining({ name: 'id' }));
            expect(results.data).toContainEqual(expect.objectContaining({ name: 'name' }));
            expect(results.data).toContainEqual(expect.objectContaining({ name: 'age' }));
        });

        test('REPRODUCE BUG: Call queryAsync the same way allTables() does', async () => {
            await memoryDb.connect();
            // This mimics the exact call pattern from allTables()
            const results = await memoryDb.queryAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'");

            expect(results.data.length).toBeGreaterThan(0);
            expect(results.data).toContainEqual({ name: 'users' });
        });

        test('REPRODUCE BUG: Call queryAsync with explicit null', async () => {
            await memoryDb.connect();
            // This mimics passing null explicitly
            const results = await memoryDb.queryAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'", null);

            expect(results.data.length).toBeGreaterThan(0);
            expect(results.data).toContainEqual({ name: 'users' });
        });

        test('REPRODUCE BUG: Call queryAsync with undefined', async () => {
            await memoryDb.connect();
            // This might be what's causing the error
            const results = await memoryDb.queryAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'", undefined as any);

            expect(results.data.length).toBeGreaterThan(0);
            expect(results.data).toContainEqual({ name: 'users' });
        });
    });

    describe('All MemoryDatabase methods', () => {
        beforeEach(async () => {
            await memoryDb.connect();
        });

        test('select() method should work with parameters', async () => {
            const results = await memoryDb.select<{ id: number, name: string }>('SELECT id, name FROM users WHERE id = ?', { id: 1 });

            expect(results.data).toEqual([{ id: 1, name: 'Alice' }]);
        });

        test('select() method should work without parameters', async () => {
            const results = await memoryDb.select('SELECT * FROM users ORDER BY id');

            expect(results.data).toHaveLength(2);
        });

        test('query() method (synchronous wrapper) should work', async () => {
            const results = memoryDb.query('SELECT * FROM users ORDER BY id');

            expect(results.data).toHaveLength(2);
            expect(results.data[0]).toHaveProperty('id');
            expect(results.data[0]).toHaveProperty('name');
        });

        test('getAllTables() should return list of table names', async () => {
            const tables = await memoryDb.getAllTables();

            expect(Array.isArray(tables)).toBe(true);
            expect(tables).toContain('users');
        });

        test('getDetailedTableInfo() should return detailed column information', async () => {
            const info = await memoryDb.getDetailedTableInfo('users');

            expect(info).toHaveLength(3);

            const idColumn = info.find(col => col.name === 'id');
            expect(idColumn).toBeDefined();
            expect(idColumn?.isPrimaryKey).toBe(true);
            expect(idColumn?.type).toBe('INTEGER');

            const nameColumn = info.find(col => col.name === 'name');
            expect(nameColumn).toBeDefined();
            expect(nameColumn?.notNull).toBe(true);
            expect(nameColumn?.type).toBe('TEXT');
        });

        test('getForeignKeys() should return foreign key information', async () => {
            const fks = await memoryDb.getForeignKeys('users');

            // Test database has no foreign keys
            expect(Array.isArray(fks)).toBe(true);
            expect(fks).toHaveLength(0);
        });

        test('getDetailedSchema() should return full schema for all tables', async () => {
            const schema = await memoryDb.getDetailedSchema();

            expect(Array.isArray(schema)).toBe(true);
            expect(schema.length).toBeGreaterThan(0);

            const usersTable = schema.find(table => table.name === 'users');
            expect(usersTable).toBeDefined();
            expect(usersTable?.columns).toHaveLength(3);
            expect(usersTable?.foreignKeys).toBeDefined();
        });

        test('getSchema() should return TableInfo array', async () => {
            const schema = await memoryDb.getSchema();

            expect(Array.isArray(schema)).toBe(true);
            expect(schema.length).toBeGreaterThan(0);

            const usersTable = schema.find(table => table.name === 'users');
            expect(usersTable).toBeDefined();
            expect(usersTable?.name).toBe('users');
            expect(usersTable?.columns).toHaveLength(3);
        });

        test('explain() should return empty object', () => {
            const result = memoryDb.explain();

            expect(result).toEqual({});
        });

        test('REPRODUCE BUG: Calling select() without await should return a Promise', async () => {
            // This is what's happening in SQLSealFileView.ts line 124
            const result = memoryDb.select('SELECT * FROM users');

            // Result should be a Promise
            expect(result).toBeInstanceOf(Promise);

            // Trying to access .data or .columns on a Promise would fail
            expect((result as any).data).toBeUndefined();
            expect((result as any).columns).toBeUndefined();

            // This would cause "cannot convert undefined" errors
        });
    });

    describe('Error handling', () => {
        test('should throw error when querying before connect()', () => {
            expect(() => {
                memoryDb.query('SELECT * FROM users');
            }).toThrow('Database not connected');
        });

        test('should handle invalid SQL gracefully', async () => {
            await memoryDb.connect();

            expect(() => {
                memoryDb.query('INVALID SQL STATEMENT');
            }).toThrow();
        });

        test('should handle queries on non-existent tables', async () => {
            await memoryDb.connect();

            expect(() => {
                memoryDb.query('SELECT * FROM nonexistent_table');
            }).toThrow();
        });

        test('should handle invalid table names in getColumns()', async () => {
            await memoryDb.connect();
            const results = await memoryDb.getColumns('nonexistent_table');

            expect(results.data).toEqual([]);
        });
    });

    describe('Disconnect behavior', () => {
        test('should close database connection', async () => {
            await memoryDb.connect();
            const resultBefore = memoryDb.query('SELECT 1 as test');
            expect(resultBefore.data).toEqual([{ test: 1 }]);

            await memoryDb.disconnect();

            expect(() => {
                memoryDb.query('SELECT 1 as test');
            }).toThrow('Database not connected');
        });

        test('should be safe to disconnect multiple times', async () => {
            await memoryDb.connect();
            await memoryDb.disconnect();
            await memoryDb.disconnect(); // Should not throw

            expect(() => {
                memoryDb.query('SELECT 1');
            }).toThrow('Database not connected');
        });
    });

});
