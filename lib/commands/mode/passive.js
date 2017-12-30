const BaseCommand = require('../../base-command');

class Passive extends BaseCommand {
    constructor(socketManager) {
        super(socketManager);
        this.socketManager = socketManager;
        this.command = 'PASV';
        this.type = this.consts.PASSIVE_MODE;
    }

    async start(CommandClass, params) {
        const answer = await super.send();
        this.commandClass = new CommandClass(this.socketManager, params);
        await this.commandClass.send(true);

        await this.connected(answer.payload);

        return this.action(this.commandClass);
    }

    async connected(payload) {
        return this.socketManager.dataConnect(payload);
    }

    action(commandClass) {
        return this[commandClass['action']]();
    }

    receive() {
        return new Promise((resolve, reject) => {

            const stream = this.readStream();

            let buffer = '';
            stream.on('data', chunk => {
                buffer += chunk;
            });

            stream.once('end', () => {
                resolve(this.parser.parseList(buffer.toString()));
            });

            stream.once('error', reject);
        });
    }

    readStream() {
        return this.socketManager.getDataStream();
    }

    writeStream() {
        return this.socketManager.getDataStream(true);
    }
}

module.exports = Passive;