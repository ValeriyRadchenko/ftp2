const BaseCommand = require('../../base-command');

class ChangeWorkingDirectory extends BaseCommand {
    constructor(socket, path = '') {
        super(socket);
        this.command = 'CWD';
        this.params = path;
        this.type = this.consts.WORKING_DIRECTORY_SET;
    }
}

module.exports = ChangeWorkingDirectory;