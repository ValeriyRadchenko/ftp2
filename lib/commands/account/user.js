const BaseCommand = require('../../base-command');

class User extends BaseCommand {
    constructor(socket, username = 'anonymous') {
        super(socket);
        this.command = 'USER';
        this.params = username;
        this.type = this.consts.USERNAME_OK;
    }
}

module.exports = User;