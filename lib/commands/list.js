const Passive = require('./passive');

class List extends Passive {
    constructor(socket, path = '') {
        super(socket);
        this.passiveCommand = 'LIST';
        this.path = path;
    }

    async send() {
        await super.start();
        await super.passiveSend(
            this.passiveCommand,
            this.path,
            [
                this.consts.FILE_STATUS_OK,
                this.consts.DATA_CONNECTION_ALREADY_OPENED
            ]
        );

        return this.parser.parseList(await super.receive());
    }
}

module.exports = List;