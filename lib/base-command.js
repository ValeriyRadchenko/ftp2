const Parser = require('./parser');
const consts = require('./consts');

class BaseCommand {
    constructor(socketManager) {
        this.socketManager = socketManager;
        this.logger = this.socketManager.logger;
        this.parser = new Parser();
        this.consts = consts;

        this.command = null;
        this.params = null;
        this.type = null;
        this.read = null;
    }

    async send(keepAlive) {
        this.logger.command(this.command, this.params, this.type);

        if (!this.command) {
            throw new Error('Command is not defined');
        }

        if (!this.type) {
            throw new Error('Type is not defined');
        }

        let buffer = this.command;
        if (this.params) {
            buffer += ` ${this.params}`;
        }

        buffer += '\r\n';

        return this.socketManager.command(buffer.toString('binary'), this.type, this.read, keepAlive);
    }
}

module.exports = BaseCommand;