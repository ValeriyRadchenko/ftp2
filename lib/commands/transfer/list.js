const BaseCommand = require('../../base-command');

class List extends BaseCommand {
    constructor(socket, path = '') {
        super(socket);
        this.command = 'LIST';
        this.params = path;
        this.type = [
            this.consts.FILE_STATUS_OK,
            this.consts.DATA_CONNECTION_ALREADY_OPENED
        ];
        this.action = 'receive';
    }
}

module.exports = List;