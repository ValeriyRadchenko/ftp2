const SocketManager = require('./socket-manager');

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
    Auth,
    ChangeWorkingDirectory
} = require('./commands');

class FTP {
    constructor() {
        this.connected = false;
    }

    async connect(options) {
        this.socketManager = new SocketManager(options);
        this.options = options;
        await this.socketManager.commandConnect();
        if (this.options.secure) {
            await new Auth(this.socketManager).send();
            await this.socketManager.commandSecure();
            await new ProtectionBufferSize(this.socketManager).send();
            await await new ProtectionLevel(this.socketManager).send();
        }
        this.connected = true;
        await new User(this.socketManager, options.user).send();
        return new Password(this.socketManager, options.password).send();
    }

    async list(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return new Passive(this.socketManager, this.options).start(List, path);
    }

    async get(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        await new Type(this.socketManager).send();
        await new Mode(this.socketManager).send();
        return new Passive(this.socketManager, this.options).start(Retrieve, path);
    }

    async put(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        await new Type(this.socketManager).send();
        // await new Mode(this.socketManager).send();
        return new Passive(this.socketManager, this.options).start(Store, path);
    }

    async cwd(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return new ChangeWorkingDirectory(this.socketManager, path).send();
    }

    async disconnect() {
        return this.socketManager.finish();
    }
}

module.exports = FTP;