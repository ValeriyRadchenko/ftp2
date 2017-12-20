const Passive = require('./passive');

class List extends Passive {
    constructor(socket, path = '') {
        super(socket);
        this.passiveCommand = 'LIST';
        this.path = path;
    }

    async send() {
        return super.start(this.passiveCommand, this.path, this.consts.FILE_STATUS_OK);
    }
}

module.exports = List;