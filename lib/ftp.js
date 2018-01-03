const SocketManager = require('./socket-manager');
const Runner = require('./runner');
const Logger = require('./logger');
const {
    User,
    Password,
    List,
    Retrieve,
    Store,
    Passive,
    Active,
    Type,
    ProtectionBufferSize,
    ProtectionLevel,
    Auth,
    ChangeWorkingDirectory,
    Feature,
    Mode
} = require('./commands');

class FTP {
    constructor() {
        this.connected = false;
    }

    async connect(options) {
        this.logger = new Logger(options.logger);
        this.socketManager = new SocketManager(options, this.logger);
        this.options = options;

        await this.socketManager.commandConnect();
        if (this.options.secure) {
            if (typeof this.options.secure === 'string') {
                await new Auth(this.socketManager, this.options.secure.toUpperCase()).send();
            } else {
                await new Auth(this.socketManager).send();
            }
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

    getCompression() {
        if (this.options.compress) {
            return [Mode, 'Z'];
        }

        return [];
    }

    getMode() {
        if (this.options.active && typeof this.options.active === 'object') {
            return Active;
        }

        return Passive
    }

    async list(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return this.runner
            .command(...this.getCompression())
            .mode(this.getMode())
            .command(List, path)
            .run();
    }

    async get(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return this.runner
            .command(Type)
            .command(...this.getCompression())
            .mode(this.getMode())
            .command(Retrieve, path)
            .run();
    }

    async put(path) {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return this.runner
            .command(Type)
            .command(...this.getCompression())
            .mode(this.getMode())
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

    async features() {
        if (!this.connected) {
            throw new Error('Socket is not connected');
        }

        return this.runner
            .command(Feature)
            .run();
    }

    async disconnect() {
        return this.socketManager.finish();
    }
}

module.exports = FTP;