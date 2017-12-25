const Parser = require('./parser');
const consts = require('./consts');

class BaseCommand {
    constructor(socketManager) {
        this.socketManager = socketManager;
        this.parser = new Parser();
        this.consts = consts;

        this.command = null;
        this.params = null;
        this.type = null;
    }

    async send(keepAlive) {
        console.log('[COMMAND]', this.command, this.params, this.type);

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

        return this.socketManager.command(buffer.toString('binary'), this.type, keepAlive);
    }
}

module.exports = BaseCommand;