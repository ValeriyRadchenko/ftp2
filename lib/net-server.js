const net = require('net');
const consts = require('./consts');
const Parser = require('./parser');

class NetServer {
    constructor(commandSocket, logger) {
        this.server = net.createServer(connection => {
            console.log('connected');
            this.connections.push(connection);
            this.server.emit('connected', connection);
        });
        this.commandSocket = commandSocket;
        this.parser = new Parser();
        this.logger = logger;

        this.connections = [];
        this.transfering = null;
    }

    start(options) {
        const defaultOptions = {
            host: '127.0.0.1',
            port: 20
        };

        return new Promise((resolve, reject) => {
            this.server.once('error', error => {
                console.log(error);
                reject(error);
            });
            this.server.listen(options.port, () => {
                console.log(`NetServer listen port ${options.port}`);
                resolve();
            });
        });
    }

    read() {
        return new Promise((resolve, reject) => {
            this.getSocket()
                .then(socket => {
                    let buffer = '';
                    socket.on('data', chunk => {
                        console.log('data');
                        buffer += chunk.toString();
                    });

                    socket.once('end', () => {
                        socket.removeAllListeners('error');
                        socket.removeAllListeners('data');
                        resolve(buffer);
                    });

                    socket.once('error', error => {
                        socket.removeAllListeners('end');
                        socket.removeAllListeners('data');
                        reject(error);
                    });
                });
        });
    }

    getSocket() {
        console.log('get socket');
        return new Promise(resolve => {
            this.server.once('connected', connection => {
                this.startTransferring(connection);
                // this.close()
                //     .then(() => {
                //        console.log('CLOSED');
                //     });
                resolve(connection);
            })
        });

    }

    startTransferring(socket) {
        this.transfering = Promise.all([
            this.onDataSocketEnded(socket),
            this.onTransferCompleteCommand()
        ])
            .catch(error => {
                console.log(error);
            })
    }

    waitUntilDataWillTransferred() {
        if (!this.transfering) {
            return Promise.resolve();
        }
        console.log('waiting...');
        return this.transfering;
    }

    onTransferCompleteCommand() {
        return new Promise((resolve, reject) => {
            if (!this.transfering) {
                resolve(true);
            }
            console.log('transferring start');
            this.commandSocket.once('data', chunk => {
                this.logger.answer('NetServer', chunk.toString());
                console.log('transferring complete');
                this.transfering = null;
                this.parse(chunk, consts.TRANSFER_COMPLETE)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    onDataSocketEnded(socket) {
        return new Promise((resolve, reject) => {
            socket.once('end', () => {
                console.log('NetServer ended');
                socket.removeAllListeners('error');
                resolve();
            });

            socket.once('error', error => {
                socket.removeAllListeners('end');
                reject(error);
            });
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

    getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[ key ] === value);
    }

    async close() {
        console.log('close');
        // todo Close before start new command
        await this.waitUntilDataWillTransferred();
        for (const connection of this.connections) {
            await this.closeConnection(connection);
        }
        console.log('closing...');
        return this.closeServer();
    }

    closeServer() {
        return new Promise(resolve => {
            this.server.close(resolve);
        });
    }

    closeConnection(connection) {
        return new Promise(resolve => {
            connection.destroy();
            resolve();
        });
    }
}

module.exports = NetServer;