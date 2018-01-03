const BaseCommand = require('../../base-command');

class Active extends BaseCommand {
    constructor(socketManager) {
        super(socketManager);
        this.socketManager = socketManager;
        this.command = 'PORT';
        this.type = this.consts.TRANSFER_MODE_SET;
        this.server = null;
    }

    async start(CommandClass, params) {
        const { active } = this.socketManager.options;
        this.params = this.getParams(active);

        this.server = await this.createNetServer();

        await super.send();
        this.commandClass = new CommandClass(this.socketManager, params);
        await this.commandClass.send(true);

        return this.action(this.commandClass);
    }

    async createNetServer() {
        return this.socketManager.createNetServer();
    }

    action(commandClass) {
        return this[commandClass['action']]();
    }

    async receive() {
        return this.server.read();
    }

    readStream() {
        return this.server.getSocket();
    }

    writeStream() {
        return this.socketManager.server.getSocket();
    }

    getParams(activeParams) {
        const host = activeParams.host.split('.').join(',');
        const port = [];
        port[0] = activeParams.port;
        port[1] = activeParams.port % 256;
        port[0] = (activeParams.port - port[1]) / 256;
        return `${host},${port.join(',')}`;
    }
}

module.exports = Active;