const BaseCommand = require('../base-command');
const Socket = require('net').Socket;

class Passive extends BaseCommand {
    constructor(baseSocket) {
        super(baseSocket);
        this.baseSocket = baseSocket;
        this.command = 'PASV';
        this.type = this.consts.PASSIVE_MODE;
        this.dataSocket = null;
    }

    async start(CommandClass, params) {
        const payload = await super.send();
        this.dataSocket = new Socket();
        this.dataSocket.setTimeout(0);
        this.dataSocket.setKeepAlive(true);
        this.dataSocket.connect(payload.port, payload.ip);
        this.commandClass = new CommandClass(this.baseSocket, params);
        return this.connected();
    }

    connected() {
        return new Promise((resolve, reject) => {
            if (!this.dataSocket) {
                reject('Data socket is closed');
            }

            this.dataSocket.once('connect', () => {
                this.commandClass.send()
                    .then(() => {
                        return this.commandClass;
                    })
                    .then(commandClass => {
                        resolve(this[ commandClass[ 'action' ] ]());
                    })
                    .catch(error => {
                        reject(error);
                    })
            });
            this.dataSocket.once('error', error => {
                this.destroy();
                reject(error);
            })
        })
    }

    receive() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.collect(),
                this.dummy()
            ])
                .then(result => {
                    resolve(this.parser.parseList(result[ 0 ]));
                })
                .catch(reject);
        });
    }

    collect() {
        return new Promise((resolve, reject) => {
            if (!this.dataSocket) {
                reject('Data socket is closed');
            }

            let buffer = '';
            this.dataSocket.on('data', chunk => {
                buffer += chunk;
            });

            this.dataSocket.once('end', () => {
                this.destroy();
                resolve(buffer.toString());
            });

            this.dataSocket.once('error', error => {
                this.destroy();
                reject(error);
            });
        });
    }

    dummy() {
        return new Promise(resolve => {
            this.socket.once('data', chunk => {
                console.log('DUMMY', chunk.toString());
                resolve();
            })
        });
    }

    stream() {
        if (!this.dataSocket) {
            throw new Error('Data socket is closed');
        }
        this.dataSocket.once('error', () => {
            this.destroy();
        });

        this.socket.once('data', chunk => {
            console.log('DUMMY', chunk.toString());
        });

        return this.dataSocket;
    }

    destroy() {
        if (this.dataSocket) {
            this.dataSocket.destroy();
        }
        this.dataSocket = null;
    }
}

module.exports = Passive;