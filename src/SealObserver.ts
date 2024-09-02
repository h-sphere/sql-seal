import { Logger } from "./logger";

type Callback = () => void;

export class SealObserver {
    private tables: Map<string, Set<Callback>>;

    private tags: Map<string, Set<Callback>>;
    private logger: Logger

    constructor(verbose = false) {
        this.tables = new Map();
        this.tags = new Map();
        this.logger = new Logger(verbose)
    }

    registerObserver(tableNames: string | string[], observer: Callback, tag?: string) {
        if (typeof tableNames === 'string') {
            tableNames = [tableNames];
        }
        tableNames.forEach(tableName => {
            if (!this.tables.has(tableName)) {
                this.tables.set(tableName, new Set<Callback>());
                    this.logger.log(`Table "${tableName}" registered.`);
            }
            const observers = this.tables.get(tableName);
            if (observers !== undefined) {
                observers.add(observer);
                this.logger.log(`Observer registered for "${tableName}".`);
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

    hasAnyObserver(tableNames: string[]) {
        return tableNames.reduce((acc, t) => 
            acc || (this.tables.has(t) && this.tables.get(t)!.size > 0),
        false)
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
        this.logger.log(`Observer unregistered.`);
    }

    fireObservers(tableName: string) {
        if (this.tables.has(tableName)) {
            const observers = this.tables.get(tableName);
            if (observers) {
                observers.forEach(observer => observer());
                this.logger.log(`Observers fired for table "${tableName}".`);
            }
        }
    }
}