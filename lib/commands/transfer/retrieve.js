const BaseCommand = require('../../base-command');

class Retrieve extends BaseCommand {
    constructor(socket, path = '') {
        super(socket);
        this.command = 'RETR';
        this.params = path;
        this.type = [
            this.consts.FILE_STATUS_OK,
            this.consts.DATA_CONNECTION_ALREADY_OPENED
        ];
        this.action = 'readStream';
    }
}

module.exports = Retrieve;