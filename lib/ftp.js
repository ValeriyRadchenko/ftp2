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
    }

    async connect(options) {
        if (options.secure) {
            const connect = new Connect(this.socket, options);
            const session = await connect.start();
            await new Auth(this.socket).send();
            this.socket = await this.secure(options);
            await new ProtectionBufferSize(this.socket).send();
            return await new ProtectionLevel(this.socket).send();
            // await new User(this.socket, session.user).send();
            // return new Password(this.socket, session.password).send();
        } else {
            const connect = new Connect(this.socket, options);
            const session = await connect.start();
            this.connected = true;
            await new Auth(this.socket).send();
            await new User(this.socket, session.user).send();
            await new Password(this.socket, session.password).send();
            await new ProtectionBufferSize(this.socket).send();
            return await new ProtectionLevel(this.socket).send();
        }

    }

    secure(options) {
        return new Promise((resolve, reject) => {
            const socket = new Socket();
            const secureOptions = {
                host: options.host,
                port: options.port,
                socket: socket
            };
            const tlsSocket = tls.connect(secureOptions, () => {
                console.log('secure connected');
                resolve(tlsSocket);
            });
            tlsSocket.setTimeout(0);
            tlsSocket.setKeepAlive(true);
            tlsSocket.on('data', chunk => {
                console.log(chunk.toString());
            });
        });
    }

    async list(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return new Passive(this.socket).start(List, path);
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
                        resolve();
                    })
                    .catch(() => {
                        clearTimeout(timer);
                        this.socket.end();
                        reject();
                    });
            } else {
                clearTimeout(timer);
                this.socket.end();
                resolve();
            }
        });
    }
}

module.exports = FTP;