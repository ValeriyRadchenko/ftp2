const BaseCommand = require('../base-command');
const Socket = require('net').Socket;

class Passive extends BaseCommand {
    constructor(baseSocket) {
        super(baseSocket);
        this.command = 'PASV';
        this.type = this.consts.PASSIVE_MODE;
        this.dataSocket = null;
    }

    async start() {
        const payload = await super.send();
        this.dataSocket = new Socket();
        this.dataSocket.setTimeout(0);
        this.dataSocket.setKeepAlive(true);
        this.dataSocket.connect(payload.port, payload.ip);
        return this.connected();
    }

    connected() {
        return new Promise((resolve, reject) => {
            if (!this.dataSocket) {
                reject('Data socket is closed');
            }

            this.dataSocket.once('connect', () => {
                resolve(this.dataSocket);
            });
            this.dataSocket.once('error', error => {
                this.destroy();
                reject(error);
            })
        })
    }

    async passiveSend(command, params, type) {
        this.command = command;
        this.params = params;
        this.type = type;

        return super.send();
    }

    receive() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.collect(),
                this.dummy()
            ])
                .then(result => {
                    resolve(result[ 0 ])
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
                console.log('data');
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