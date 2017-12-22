const BaseCommand = require('../../base-command');

class Store extends BaseCommand {
    constructor(socket, path = '') {
        super(socket);
        this.command = 'STOR';
        this.params = path;
        this.type = [
            this.consts.FILE_STATUS_OK,
            this.consts.DATA_CONNECTION_ALREADY_OPENED
        ];
        this.action = 'stream';
    }
}

module.exports = Store;