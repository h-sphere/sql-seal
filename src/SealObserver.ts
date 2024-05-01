type Callback = () => void;

export class SealObserver {
    private tables: Map<string, Set<Callback>>;
    private verbose: boolean;

    private files: Map<string, Set<string>>;

    constructor(verbose = false) {
        this.tables = new Map();
        this.files = new Map();
        this.verbose = verbose;
    }

    registerFile(fileName: string) {
        if (!this.files.has(fileName)) {
            this.files.set(fileName, new Set<string>());
            if (this.verbose) {
                console.log(`File "${fileName}" registered.`);
            }
        }
    }

    registerTableToFile(tableName: string, fileName: string) {
        if (!this.files.has(fileName)) {
            this.files.set(fileName, new Set<string>());
            if (this.verbose) {
                console.log(`File "${fileName}" registered.`);
            }
        }
        const tables = this.files.get(fileName);
        if (tables !== undefined) {
            tables.add(tableName);
            if (this.verbose) {
                console.log(`Table "${tableName}" registered to file "${fileName}".`);
            }
        }
    }

    registerElementToFile(elementName: string, fileName: string) {
        if (!this.files.has(fileName)) {
            this.files.set(fileName, new Set<string>());
            if (this.verbose) {
                console.log(`File "${fileName}" registered.`);
            }
        }
        const elements = this.files.get(fileName);
        if (elements !== undefined) {
            elements.add(elementName);
            if (this.verbose) {
                console.log(`Element "${elementName}" registered to file "${fileName}".`);
            }
        }
    }

    registerTable(tableName: string) {
        if (!this.tables.has(tableName)) {
            this.tables.set(tableName, new Set<Callback>());
            if (this.verbose) {
                console.log(`Table "${tableName}" registered.`);
            }
        }
    }

    registerObserver(tableNames: string | string[], observer: Callback) {
        if (typeof tableNames === 'string') {
            tableNames = [tableNames];
        }
        tableNames.forEach(tableName => {
            if (!this.tables.has(tableName)) {
                this.tables.set(tableName, new Set<Callback>());
                if (this.verbose) {
                    console.log(`Table "${tableName}" registered.`);
                }
            }
            const observers = this.tables.get(tableName);
            if (observers !== undefined) {
                observers.add(observer);
                if (this.verbose) {
                    console.log(`Observer registered for table "${tableName}".`);
                }
            }
        });
    }

    unregisterObserver(observer: Callback) {
        this.tables.forEach(observers => {
            observers.delete(observer);
        });
        if (this.verbose) {
            console.log(`Observer unregistered.`);
        }
    }

    fireObservers(tableName: string) {
        if (this.tables.has(tableName)) {
            const observers = this.tables.get(tableName);
            if (observers) {
                observers.forEach(observer => observer());
                if (this.verbose) {
                    console.log(`Observers fired for table "${tableName}".`);
                }
            }
        }
    }

    fireFilenameObservers(fileName: string) {
        if (this.files.has(fileName)) {
            const tables = this.files.get(fileName);
            if (tables) {
                tables.forEach(tableName => {
                    this.fireObservers(tableName);
                });
            }
        }
        this.tables.forEach(observers => {
            observers.forEach(observer => observer());
        });
        if (this.verbose) {
            console.log(`Observers fired for file "${fileName}".`);
        }
    }
}