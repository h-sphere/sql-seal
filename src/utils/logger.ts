export class Logger {
    constructor(verbose: boolean) {
        if (verbose) {
            this.console = console
        } else {
            this.console = {
                log: () => { },
                error: () => { }
            }
        }
    }

    private console: Pick<typeof console, 'log' | 'error'>

    log(...args: any[]) {
        this.console.log(...args)
    }

    error(...args: any[]) {
        this.console.error(...args)
    }
}