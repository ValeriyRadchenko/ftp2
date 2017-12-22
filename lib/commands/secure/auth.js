const BaseCommand = require('../../base-command');

class Auth extends BaseCommand {
    constructor(socket, type = 'TLS') {
        super(socket);
        this.command = 'AUTH';
        this.params = type;
        this.type = this.consts.AUTH_SUCCESSFUL;
    }
}

module.exports = Auth;