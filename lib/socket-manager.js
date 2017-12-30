const { Socket } = require('net');
const tls = require('tls');
const zlib = require('zlib');
const EventEmitter = require('events').EventEmitter;

const Parser = require('./parser');
const consts = require('./consts');

class SocketManager extends EventEmitter {
    constructor(options, logger) {
        super();
        this.logger = logger;
        this.parser = new Parser();
        const defaultOptions = {
            host: 'localhost',
            port: 21,
            user: 'anonymous',
            password: 'anonymous',
            secure: false
        };
        this.options = { ...defaultOptions, ...options };
        this.commandNetSocket = new Socket();
        this.commandTLSSocket = null;
        this.dataNetSocket = null;
        this.dataTLSSocket = null;

        this.transfering = null;
    }

    commandConnect() {
        return new Promise((resolve, reject) => {
            this.commandNetSocket.once('connect', () => {
            });

            this.commandNetSocket.once('error', reject);
            this.commandNetSocket.once('data', () => {
                this.commandNetSocket.removeAllListeners('error');
                resolve();
            });
            this.commandNetSocket.connect(this.options.port, this.options.host);
        });
    }

    commandSecure() {
        return new Promise((resolve, reject) => {
            this.commandNetSocket.removeAllListeners('data');
            this.commandNetSocket.removeAllListeners('error');

            let secureOptions = {
                host: this.options.host,
                socket: this.commandNetSocket,
                session: undefined
            };

            if (this.options.secureOptions) {
                secureOptions = { ...secureOptions, ...this.options.secureOptions }
            }

            this.commandTLSSocket = tls.connect(secureOptions, () => {
                this.commandTLSSocket.removeAllListeners('error');
                this.logger.info('command tls connected');
                resolve();
            });

            this.commandTLSSocket.setEncoding('binary');
            this.commandTLSSocket.once('error', reject);
        });
    }

    dataConnect(params) {
        if (this.options.secure) {
            return this.dataSecure(params);
        }
        return new Promise((resolve, reject) => {
            this.dataFinish()
                .then(() => {
                    this.dataNetSocket = new Socket();
                    this.dataNetSocket.once('connect', () => {
                        this.startTransferring();
                        resolve();
                    });
                    this.dataNetSocket.once('error', error => {
                        this.emit('data-error', error);
                        reject(error);
                    });

                    this.dataNetSocket.connect(params.port, params.host);
                });
        });
    }

    dataSecure(params) {
        return new Promise((resolve, reject) => {
            this.dataFinish()
                .then(() => {
                    this.dataNetSocket = new Socket();
                    let secureOptions = {
                        host: this.options.host,
                        socket: this.dataNetSocket,
                        session: this.commandTLSSocket.getSession()
                    };

                    if (this.options.secureOptions) {
                        secureOptions = { ...secureOptions, ...this.options.secureOptions }
                    }

                    this.dataTLSSocket = tls.connect(secureOptions, () => {
                        this.logger.info('tls connected');
                        this.startTransferring();
                        resolve();
                    });

                    this.dataTLSSocket.once('error', error => {
                        this.logger.info('tls error', error);
                        reject(error);
                    });

                    this.dataNetSocket.once('connect', () => {
                        this.logger.info('data net connected');
                    });

                    this.dataNetSocket.connect(params.port, params.host);
                });
        });
    }

    getDataStream(isWriteStream) {
        const socket = this.dataTLSSocket || this.dataNetSocket;
        let stream = socket;
        if (this.options.compress) {
            let zStream = null;

            if (!isWriteStream) {
                zStream = zlib.createInflate();
                socket.pipe(zStream);
            } else {
                zStream = zlib.createDeflate({ level: 8 });
                zStream.pipe(socket);
            }

            stream = zStream;
        }

        return stream;
    }

    read() {
        return new Promise(resolve => {
            const socket = this.commandTLSSocket || this.commandNetSocket;
            let buffer = '';
            const onData = chunk => {
                const answer = this.parser.parse(chunk, true);
                if (answer && answer.code === consts.FEATURE_SUPPORTED) {
                    socket.removeListener('data', onData);
                    resolve(this.parser.parseFeatures(buffer || answer.raw));
                }

                buffer += chunk.toString();
            };

            socket.on('data', onData);
        });
    }

    command(command, type, read, keepAlive) {
        return new Promise((resolve, reject) => {
            if (keepAlive) {
                this.send(command, type)
                    .then(resolve)
                    .catch(reject);
            } else if (read) {
                this.dataFinish()
                    .then(() => {
                        return this.send(command, type);
                    })
                    .then(() => {
                        return this.read();
                    })
                    .then(payload => {
                        resolve(payload);
                    })
                    .catch(reject);
            } else {
                this.dataFinish()
                    .then(() => {
                        return this.send(command, type);
                    })
                    .then(payload => {
                        resolve(payload);
                    })
                    .catch(reject);
            }
        });
    }

    send(command, type) {
        return new Promise((resolve, reject) => {
            const socket = this.commandTLSSocket || this.commandNetSocket;

            socket.once('data', chunk => {
                this.logger.answer(command, chunk.toString());

                this.parse(chunk, type)
                    .then(resolve)
                    .catch(reject);
            });
            this.logger.log('COMMAND WRITE', command);
            socket.write(command);
        });
    }

    parse(chunk, type) {
        return new Promise((resolve, reject) => {
            try {
                const answer = this.parser.parse(chunk);
                if (Array.isArray(type)) {
                    if (type.indexOf(answer.code) < 0) {
                        reject(`Code does not match ${type.map(type => this.getKeyByValue(consts, type)).join(', ')}`);
                    }
                } else if (answer.code !== type) {
                    reject(`Code does not match ${this.getKeyByValue(consts, type)}`);
                }

                resolve(answer);
            } catch (error) {
                reject(error);
            }
        });
    }

    startTransferring() {
        this.transfering = Promise.all([
            this.onDataSocketEnded(),
            this.onTransferCompleteCommand()
        ]);
    }

    waitUntilDataWillTransferred() {
        if (!this.transfering) {
            return Promise.resolve();
        }

        return this.transfering;
    }

    onDataSocketEnded() {
        return new Promise((resolve, reject) => {
            const socket = this.dataTLSSocket || this.dataNetSocket;

            socket.once('end', () => {
                socket.removeAllListeners('error');
                resolve();
            });

            socket.once('error', error => {
                socket.removeAllListeners('end');
                reject(error);
            });
        });
    }

    onTransferCompleteCommand() {
        return new Promise((resolve, reject) => {
            const socket = this.commandTLSSocket || this.commandNetSocket;

            socket.once('data', chunk => {
                this.logger.answer(chunk.toString());

                this.parse(chunk, consts.TRANSFER_COMPLETE)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[ key ] === value);
    }

    dataFinish() {
        return new Promise(resolve => {
            this.waitUntilDataWillTransferred()
                .then(() => {
                    if (!this.dataNetSocket && !this.dataTLSSocket) {
                        resolve();
                        return;
                    }

                    if (this.dataNetSocket) {
                        this.dataNetSocket.destroy();
                        this.dataNetSocket = null;
                    }

                    if (this.dataTLSSocket) {
                        this.dataTLSSocket.destroy();
                        this.dataTLSSocket = null;
                    }

                    this.logger.info('DATA FINISH');
                    resolve();
                });
        });
    }

    finish() {
        return new Promise(resolve => {
            this.waitUntilDataWillTransferred().then(() => {
                if (this.commandTLSSocket) {
                    this.commandTLSSocket.end();
                } else {
                    this.commandNetSocket.end();
                }

                this.dataFinish();

                setTimeout(() => {
                    this.commandNetSocket.removeAllListeners('connect');
                    this.commandNetSocket.removeAllListeners('error');
                    this.commandNetSocket.removeAllListeners('data');

                    if (this.commandTLSSocket) {
                        this.commandTLSSocket.removeAllListeners('connect');
                        this.commandTLSSocket.removeAllListeners('error');
                        this.commandTLSSocket.removeAllListeners('data');
                    }

                    this.commandNetSocket.destroy();

                    if (this.commandTLSSocket) {
                        this.commandTLSSocket.destroy();
                    }

                    resolve();
                }, 1000);
            });
        });
    }
}

module.exports = SocketManager;