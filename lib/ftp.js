const Socket = require('net').Socket;
const tls = require('tls');

const {
    Connect,
    User,
    Password,
    List,
    Retrieve,
    Store,
    Quit,
    Passive,
    Type,
    Mode,
    ProtectionBufferSize,
    ProtectionLevel,
    Auth
} = require('./commands');

class FTP {
    constructor() {
        this.connected = false;
        this.socket = new Socket();
        this.netSocket = null;
    }

    async connect(options) {
        this.options = options;
        const connect = new Connect(this.socket, options);
        const session = await connect.start();
        if (options.secure) {
            await new Auth(this.socket).send();
            this.netSocket = this.socket;
            this.socket = await this.secure();
            this.connected = true;
            await new ProtectionBufferSize(this.socket).send();
            await await new ProtectionLevel(this.socket).send();
        }
        this.connected = true;
        await new User(this.socket, session.user).send();
        return new Password(this.socket, session.password).send();

    }

    secure() {
        return new Promise((resolve, reject) => {
            this.socket.removeAllListeners('data');
            this.socket.removeAllListeners('error');
            const secureOptions = {
                host: this.options.host,
                socket: this.socket,
                session: undefined,
                requestCert: true,
                rejectUnauthorized: false
            };
            const tlsSocket = tls.connect(secureOptions, () => {
                resolve(tlsSocket);
            });
            tlsSocket.setEncoding('binary');
            tlsSocket.on('data', chunk => {
                console.log(chunk.toString());
            });
            tlsSocket.on('error', error => {
                console.log('error', reject);
            });
            tlsSocket.on('end', () => {
                this.netSocket.destroy();
                console.log('tls end');
            });
            tlsSocket.on('close', error => {
                this.netSocket.destroy();
                console.log('tls close', error);
            });
        });
    }

    async list(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return new Passive(this.socket, this.options).start(List, path);
    }

    async get(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        await new Type(this.socket).send();
        await new Mode(this.socket).send();
        return new Passive(this.socket).start(Retrieve, path);
    }

    async put(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        await new Type(this.socket).send();
        await new Mode(this.socket).send();
        return new Passive(this.socket).start(Store, path);
    }

    disconnect(force = false) {
        return new Promise((resolve, reject) => {
            this.connected = false;
            if (!this.socket) {
                reject(new Error('Socket is closed'));
            }
            const timer = setTimeout(() => {
                this.socket.end();
                reject();
            }, 5000);

            if (!force) {
                new Quit(this.socket).send()
                    .then(() => {
                        clearTimeout(timer);
                        this.socket.end();
                        setTimeout(() => {
                            if (this.netSocket) {
                                this.netSocket.destroy();
                            }
                            if (this.socket) {
                                this.socket.destroy();
                            }
                            resolve();
                        }, 2000);
                    })
                    .catch(() => {
                        clearTimeout(timer);
                        this.socket.end();
                        setTimeout(() => {
                            if (this.netSocket) {
                                this.netSocket.destroy();
                            }
                            if (this.socket) {
                                this.socket.destroy();
                            }
                            reject();
                        }, 2000);
                    });
            } else {
                clearTimeout(timer);
                this.socket.end();
                setTimeout(() => {
                    if (this.netSocket) {
                        this.netSocket.destroy();
                    }
                    if (this.socket) {
                        this.socket.destroy();
                    }
                    resolve();
                }, 2000);
            }
        });
    }
}

module.exports = FTP;