const Passive = require('./passive');

class Retrieve extends Passive {
    constructor(socket, path = '') {
        super(socket);
        this.passiveCommand = 'RETR';
        this.mode = 'MODE S';
        this.transferType = 'TYPE I';
        this.path = path;
    }

    async send() {
        await super.start();
        await super.passiveSend(this.transferType, null, this.consts.TRANSFER_MODE_SET);
        await super.passiveSend(this.mode, null, this.consts.TRANSFER_MODE_SET);
        await super.passiveSend(
            this.passiveCommand,
            this.path,
            [
                this.consts.FILE_STATUS_OK,
                this.consts.DATA_CONNECTION_ALREADY_OPENED
            ]
        );

        return super.stream();
    }
}

module.exports = Retrieve;