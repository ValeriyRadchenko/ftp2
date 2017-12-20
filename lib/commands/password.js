const BaseCommand = require('../base-command');

class Password extends BaseCommand {
    constructor(socket, password = 'anonymous') {
        super(socket);
        this.command = 'PASS';
        this.params = password;
        this.type = this.consts.LOGIN_SUCCESSFUL;
    }
}

module.exports = Password;