type Callback = () => void;

export class SealObserver {
    private tables: Map<string, Set<Callback>>;
    private verbose: boolean;

    private tags: Map<string, Set<Callback>>;

    constructor(verbose = false) {
        this.tables = new Map();
        this.tags = new Map();
        this.verbose = verbose;
    }

    registerObserver(tableNames: string | string[], observer: Callback, tag?: string) {
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
            if (tag) {
                if (!this.tags.has(tag)) {
                    this.tags.set(tag, new Set<Callback>());
                }
                const tags = this.tags.get(tag);
                if (tags !== undefined) {
                    tags.add(observer);
                }
            }
        });
    }

    unregisterObserversByTag(tag: string) {
        if (this.tags.has(tag)) {
            const observers = this.tags.get(tag);
            if (observers) {
                observers.forEach(observer => {
                    this.unregisterObserver(observer)
                })
                this.tags.delete(tag)
            }
        }
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
}