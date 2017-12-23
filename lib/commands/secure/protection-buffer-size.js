const BaseCommand = require('../../base-command');

class ProtectionBufferSize extends BaseCommand {
    constructor(socket, size = '0') {
        super(socket);
        this.command = 'PBSZ';
        this.params = size;
        this.type = this.consts.TRANSFER_MODE_SET;
    }
}

module.exports = ProtectionBufferSize;