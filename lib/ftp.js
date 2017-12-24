const SocketManager = require('./socket-manager');
const Runner = require('./runner');
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

        this.runner = new Runner(this.socketManager, this.options);

        return this.runner
            .command(User, this.options.user)
            .command(Password, this.options.password)
            .run();
    }

    async list(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return this.runner
            .mode(Passive)
            .command(List, path)
            .run();
    }

    async get(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return this.runner
            .command(Type)
            .mode(Passive)
            .command(Retrieve, path)
            .run();
    }

    async put(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return this.runner
            .command(Type)
            .mode(Passive)
            .command(Store, path)
            .run();
    }

    async cwd(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return this.runner
            .command(ChangeWorkingDirectory, path)
            .run();
    }

    async disconnect() {
        return this.socketManager.finish();
    }
}

module.exports = FTP;