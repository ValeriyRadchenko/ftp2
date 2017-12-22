const BaseCommand = require('../base-command');

class Type extends BaseCommand {
    constructor(socket, type = 'I') {
        super(socket);
        this.command = 'TYPE';
        this.params = type;
        this.type = this.consts.TRANSFER_MODE_SET;
    }
}

module.exports = Type;