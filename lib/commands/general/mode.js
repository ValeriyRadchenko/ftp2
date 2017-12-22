const BaseCommand = require('../../base-command');

class Mode extends BaseCommand {
    constructor(socket, mode = 'S') {
        super(socket);
        this.command = 'MODE';
        this.params = mode;
        this.type = this.consts.TRANSFER_MODE_SET;
    }
}

module.exports = Mode;