class Logger {
    constructor(streams) {
        this.streams = streams;
    }

    log(...args) {
        const type = args.shift();
        if (!Array.isArray(this.streams)) {
            return;
        }

        for (const stream of this.streams) {
            for (const arg of args) {
                if (typeof arg === 'object') {
                    try {
                        const parsed = JSON.parse(arg);
                        stream.write(`[${type}] ${parsed}` + '\r\n');
                    } catch (error) {
                        stream.write(`[${type}] ${arg.toString()}` + '\r\n');
                    }
                    continue;
                }

                stream.write(`[${type}] ${arg.toString()}` + '\r\n');
            }

        }
    }

    info(...args) {
        this.log('INFO', ...args);
    }

    answer(...args) {
        this.log('ANSWER', ...args);
    }

    command(...args) {
        this.log('COMMAND', ...args);
    }
}

module.exports = Logger;