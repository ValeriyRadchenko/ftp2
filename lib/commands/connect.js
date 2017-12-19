const EventEmitter = require('events').EventEmitter;

class Connect extends EventEmitter {
    constructor(socket, options = {}) {
        super();

        const defaultOptions = {
            host: 'localhost',
            port: 21,
            user: 'anonymous',
            password: 'anonymous'
        };
        this.options = { ...defaultOptions, ...options };
        this.socket = socket;
    }

    start() {
        return new Promise((resolve, reject) => {
            this.socket.setTimeout(0);
            this.socket.setKeepAlive(true);

            this.socket.once('connect', () => {});
            this.socket.once('end', this.onEnd);
            this.socket.once('close', this.onClose);
            this.socket.once('data', chunk => {
                console.log(chunk.toString());
                resolve(this.options);
            });
            this.socket.on('error', error => reject(error));

            this.socket.connect(this.options.port, this.options.host);
        });
    }

    onEnd() {
        this.emit('end');
    }

    onClose() {
        this.emit('close');
    }
}

module.exports = Connect;