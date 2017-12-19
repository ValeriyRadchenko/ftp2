const Passive = require('./passive');

class List extends Passive {
    constructor(socket, path = '') {
        super(socket);
        this.command = 'LIST';
        this.path = path;
    }

    async send() {
        await super.start();
        return super.passiveSend(this.command, this.path, this.consts.FILE_STATUS_OK);
    }
}

module.exports = List;