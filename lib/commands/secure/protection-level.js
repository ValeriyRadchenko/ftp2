const BaseCommand = require('../../base-command');

class ProtectionLevel extends BaseCommand {
    constructor(socket, level = 'P') {
        super(socket);
        this.command = 'PROT';
        this.params = level;
        this.type = this.consts.USERNAME_OK;
    }
}

module.exports = ProtectionLevel;