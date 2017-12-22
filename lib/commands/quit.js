const BaseCommand = require('../base-command');

class Quit extends BaseCommand {
    constructor(socket) {
        super(socket);
        this.command = 'QUIT';
        this.type = this.consts.GOODBYE;
    }
}

module.exports = Quit;