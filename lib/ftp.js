const Socket = require('net').Socket;
const { Connect, User, Password, List } = require('./commands');

class FTP {
    constructor() {
        this.connected = false;
        this.socket = new Socket();
    }

    async connect(options) {
        const connect = new Connect(this.socket, options);
        // connect.once('end', this.onEnd());
        // connect.once('close', this.onClose());
        const session = await connect.start();
        this.connected = true;
        await new User(this.socket, session.user).send();
        return new Password(this.socket, session.password).send();
    }

    async list(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return new List(this.socket, path).send();
    }

    disconnect() {
        this.connected = false;
        if (!this.socket) {
            return;
        }

        this.socket.end();
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