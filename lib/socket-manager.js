const { Socket } = require('net');
const tls = require('tls');
const EventEmitter = require('events').EventEmitter;

const Parser = require('./parser');
const consts = require('./consts');

class SocketManager extends EventEmitter {
    constructor(options) {
        super();
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

        // this.onCommand = chunk => {
        //     console.log('[RAW ANSWER]', chunk.toString());
        //     this.emit('command-response', chunk);
        // };

        this.onData = chunk => {
            this.emit('data-chunk', chunk);
        };

        this.onDataEnd = chunk => {
            const socket = this.dataTLSSocket || this.dataNetSocket;
            socket.removeAllListeners('data');
            this.emit('data-end', chunk);
        };

        this.on('data-transfer-start', () => {
            this.commandFinishPromise = new Promise(resolve => {
                this.once('data-transfer-end', resolve);
            });
        });
    }

    commandConnect() {
        return new Promise((resolve, reject) => {
            this.commandNetSocket.once('connect', () => {
            });

            this.commandNetSocket.once('error', reject);
            this.commandNetSocket.once('data', resolve);
            this.commandNetSocket.connect(this.options.port, this.options.host);
        });
    }

    commandSecure() {
        return new Promise((resolve, reject) => {
            this.commandNetSocket.removeAllListeners('data');
            this.commandNetSocket.removeAllListeners('error');

            const secureOptions = {
                host: this.options.host,
                socket: this.commandNetSocket,
                session: undefined,
                requestCert: true,
                rejectUnauthorized: false
            };
            this.commandTLSSocket = tls.connect(secureOptions, () => {
                console.log('[INFO]', 'command tls connected');
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
                        resolve();
                    });
                    this.dataNetSocket.once('error', error => {
                        this.emit('data-error', error);
                        reject(error);
                    });
                    this.dataNetSocket.on('data', this.onData);
                    this.dataNetSocket.once('end', this.onDataEnd);
                    this.commandNetSocket.once('data', chunk => {
                        this.emit('command-response', chunk);
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
                    const secureOptions = {
                        host: this.options.host,
                        socket: this.dataNetSocket,
                        session: this.commandTLSSocket.getSession(),
                        requestCert: true,
                        rejectUnauthorized: false
                    };
                    this.dataTLSSocket = tls.connect(secureOptions, () => {
                        console.log('[INFO]', 'tls connected');
                        resolve();
                    });

                    this.dataTLSSocket.once('error', error => {
                        console.log('[INFO]', 'tls error', error);
                        reject(error);
                    });
                    this.dataTLSSocket.on('data', this.onData);
                    this.dataTLSSocket.once('end', this.onDataEnd);

                    this.dataNetSocket.once('connect', () => {
                        console.log('[INFO]', 'data net connected');
                    });

                    this.commandTLSSocket.once('data', chunk => {
                        this.emit('command-response', chunk);
                    });

                    this.dataNetSocket.connect(params.port, params.host);
                });
        });
    }

    getDataStream() {
        return this.dataTLSSocket || this.dataNetSocket;
    }

    command(command, type, keepAlive) {
        return new Promise((resolve, reject) => {
            if (keepAlive) {
                this.send(command, type)
                    .then(resolve)
                    .catch(reject)
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
                console.log('[ANSWER]', command, chunk.toString());
                this.parse(chunk)
                    .then(answer => {
                        if (Array.isArray(type)) {
                            if (type.indexOf(answer.code) < 0) {
                                reject(`Code does not match ${type.map(type => this.getKeyByValue(consts, type)).join(', ')}`);
                            }
                        } else if (answer.code !== type) {
                            reject(`Code does not match ${this.getKeyByValue(consts, type)}`);
                        }

                        resolve(answer.payload);
                    })
                    .catch(error => {
                        reject(error);
                    });
            });

            socket.write(command);
        });
    }

    parse(chunk) {
        return new Promise((resolve, reject) => {
            this.parser.once('parsed', answer => resolve(answer));
            this.parser.once('error', error => reject(error));
            this.parser.parse(chunk.toString());
        });
    }

    getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[ key ] === value);
    }

    waitUntilCommandIsFinished() {
        return new Promise(resolve => {
            const timeout = setTimeout(() => {
                resolve();
            }, 30000);

            if (!this.commandFinishPromise) {
                clearTimeout(timeout);
                resolve();
            } else {
                clearTimeout(timeout);
                this.commandFinishPromise.then(resolve);
            }
        });
    }

    dataFinish() {
        return new Promise(resolve => {
            this.waitUntilCommandIsFinished()
                .then(() => {
                    if (!this.dataNetSocket && !this.dataTLSSocket) {
                        resolve();
                        return;
                    }

                    if (this.dataNetSocket) {
                        this.dataNetSocket.end();
                    }

                    if (this.dataTLSSocket) {
                        this.dataTLSSocket.end();
                    }

                    setTimeout(() => {
                        if (this.dataNetSocket) {
                            this.dataNetSocket.removeAllListeners('connect');
                            this.dataNetSocket.removeAllListeners('error');
                            this.dataNetSocket.removeAllListeners('data');
                            this.dataNetSocket.removeAllListeners('end');

                            this.dataNetSocket.destroy();
                            this.dataNetSocket = null;
                        }

                        if (this.dataTLSSocket) {
                            this.dataTLSSocket.removeAllListeners('connect');
                            this.dataTLSSocket.removeAllListeners('error');
                            this.dataTLSSocket.removeAllListeners('data');
                            this.dataTLSSocket.removeAllListeners('end');

                            this.dataTLSSocket.destroy();
                            this.dataTLSSocket = null;
                        }
                        resolve();
                    }, 1000);
                });
        });
    }

    finish() {
        return new Promise(resolve => {
            this.waitUntilCommandIsFinished().then(() => {
                if (this.commandTLSSocket) {
                    this.commandTLSSocket.end();
                }

                this.commandNetSocket.end();

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