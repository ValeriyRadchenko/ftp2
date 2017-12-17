const Socket = require('net').Socket;
const EventEmitter = require('events').EventEmitter;
const Parser = require('./parser');
const consts = require('./consts');

class FTP extends EventEmitter {
    constructor() {
        super();
        this.options = {
            host: 'localhost',
            port: 21,
            user: 'anonymous',
            password: 'anonymous@'
        };
        this.parser = new Parser();
        this.init();
    }

    init() {
        this.connected = false;
        this.socket = null;

        this.onConnect = () => {
            console.log('conncted');
            this.connected = true;
        };

        this.onData = (chunk) => {
            this.parser.parse(chunk.toString());
            console.log(chunk.toString());
        };

        this.onError = (...args) => {
            console.log('error', args);
        };

        this.onEnd = () => {
            console.log('end');
        };

        this.onClose = () => {
            console.log('close');
        };

        this.parser.on('parsed', answer => {
            switch (answer.code) {
                case consts.CONNECTED:
                    this.send(`USER ${this.options.user}`);
                    break;
                case consts.USERNAME_OK:
                    this.send(`PASS ${this.options.password}`);
                    break;
                case consts.LOGIN_SUCCESSFUL:
                    this.emit('auth');
                    break;
                case consts.PASSIVE_MODE:
                    this.emit('passive', answer.payload);
                    break;
            }
        });
    }

    connect(options = {}) {
        return new Promise((resolve, reject) => {
            this.options = { ...this.options, ...options };

            const socket = new Socket();
            socket.setTimeout(0);
            socket.setKeepAlive(true);

            socket.once('connect', this.onConnect);
            socket.on('data', this.onData);
            socket.on('error', this.onError);
            socket.once('end', this.onEnd);
            socket.once('close', this.onClose);

            socket.connect(this.options.port, this.options.host);

            this.once('error', reject);
            this.once('auth', resolve);
            this.socket = socket;
        });
    }

    pasv() {
        return new Promise((resolve, reject) => {
            this.once('passive', address => {
                console.log('address', address);
                const socket = new Socket();
                socket.once('connect', () => {
                    resolve(socket);
                });
                socket.once('error', reject);
                socket.connect(address.port, address.ip);
            });
            this.send('PASV');
        });
    }

    list(path) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('Cannot get list, socket is not connected'));
            }
            this.pasv()
                .then(socket => {
                    this.send(`LIST ${path}`);
                    let buffer = '';
                    socket.on('data', chunk => {
                        buffer += chunk;
                    });
                    socket.once('end', () => {
                        resolve(buffer.toString());
                    });
                })
                .catch(reject);
        });
    }

    send(buffer) {
        buffer += '\r\n';
        this.socket.write(buffer.toString('binary'));
    }

    disconnect() {
        this.connected = false;
        if (!this.socket) {
            return;
        }

        this.socket.end();
    }
}

module.exports = FTP;