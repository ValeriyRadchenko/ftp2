const BaseCommand = require('../../base-command');

class ProtectionBufferSize extends BaseCommand {
    constructor(socket, size = '0') {
        super(socket);
        this.command = 'PBSZ';
        this.params = size;
        this.type = this.consts.USERNAME_OK;
    }
}

module.exports = ProtectionBufferSize;