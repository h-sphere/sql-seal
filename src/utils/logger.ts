export class Logger {
    constructor(verbose: boolean) {
        if (verbose) {
            this.console = console
        } else {
            this.console = {
                log: () => { },
                error: () => { },
                warn: () => { },
                debug: () => { },
                trace: () => { }
            }
        }
    }

    private console: Pick<typeof console, 'log' | 'error' | 'warn' | 'debug' | 'trace'>

    log(...args: any[]) {
        this.console.log(...args)
    }

    error(...args: any[]) {
        this.console.error(...args)
    }

    warn(...args: any[]) {
        this.console.warn(...args)
    }

    debug(...args: any[]) {
        this.console.debug(...args)
    }

    trace(...args: any[]) {
        this.console.trace(...args)
    }
}