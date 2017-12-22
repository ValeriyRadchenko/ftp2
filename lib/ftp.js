const Socket = require('net').Socket;
const {
    Connect,
    User,
    Password,
    List,
    Retrieve,
    Quit,
    Passive,
    Type,
    Mode
} = require('./commands');

class FTP {
    constructor() {
        this.connected = false;
        this.socket = new Socket();
    }

    async connect(options) {
        const connect = new Connect(this.socket, options);
        const session = await connect.start();
        this.connected = true;
        await new User(this.socket, session.user).send();
        return new Password(this.socket, session.password).send();
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

        // return new Retrieve(this.socket, path).send(writeStream);
        await new Type(this.socket).send();
        await new Mode(this.socket).send();
        return new Passive(this.socket).start(Retrieve, path);
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

    onEnd() {
        this.connected = false;
        console.log('end');
    }

    onClose() {
        this.connected = false;
        console.log('close');
    }
}

module.exports = FTP;