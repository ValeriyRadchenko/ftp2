const BaseCommand = require('../../base-command');

class ProtectionLevel extends BaseCommand {
    constructor(socket, level = 'P') {
        super(socket);
        this.command = 'PROT';
        this.params = level;
        this.type = this.consts.TRANSFER_MODE_SET;
    }
}

module.exports = ProtectionLevel;