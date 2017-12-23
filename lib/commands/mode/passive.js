const BaseCommand = require('../../base-command');
const Socket = require('net').Socket;
const tls = require('tls');

class Passive extends BaseCommand {
    constructor(baseSocket, options) {
        super(baseSocket);
        this.baseSocket = baseSocket;
        this.netBaseSocket = null;
        this.command = 'PASV';
        this.type = this.consts.PASSIVE_MODE;
        this.dataSocket = null;
        this.options = options;
    }

    async start(CommandClass, params) {
        const payload = await super.send();
        this.dataSocket = new Socket();
        this.dataSocket.setTimeout(0);
        this.dataSocket.setKeepAlive(true);
        this.dataSocket.connect(payload.port, payload.ip);
        await this.connected();
        if (this.options.secure){
            try {
                this.dataSocket = await this.secure(payload);
            } catch (error) {
                throw error;
            }
        }
        this.commandClass = new CommandClass(this.baseSocket, params);
        return this.action();
    }

    secure(payload) {
        return new Promise((resolve, reject) => {
            this.netBaseSocket = this.dataSocket;
            const secureOptions = {
                host: this.options.host,
                socket: this.dataSocket,
                session: this.socket.getSession(),
                requestCert: true,
                rejectUnauthorized: false
            };
            const tlsSocket = tls.connect(secureOptions, () => {
                console.log('tls connected');
            });
            tlsSocket.setTimeout(0);
            tlsSocket.on('error', error => {
                console.log('tls error', error);
                reject(error);
            });
            resolve(tlsSocket);
        });
    }

    connected() {
        return new Promise((resolve, reject) => {
            if (!this.dataSocket) {
                reject('Data socket is closed');
            }

            this.dataSocket.once('connect', () => {
                console.log('net socket connected');
                resolve();
            });
            this.dataSocket.once('error', error => {
                this.destroy();
                reject(error);
            })
        })
    }

    action() {
        return new Promise((resolve, reject) => {
            this.commandClass.send()
                .then(() => {
                    return this.commandClass;
                })
                .then(commandClass => {
                    resolve(this[ commandClass[ 'action' ] ]());
                })
                .catch(reject);
        });
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
                this.destroy();
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
            this.dataSocket.end();
        }
        if (this.netBaseSocket) {
            this.netBaseSocket.end();
        }
        this.dataSocket = null;
    }
}

module.exports = Passive;