const BaseCommand = require('../../base-command');

class Feature extends BaseCommand {
    constructor(socket) {
        super(socket);
        this.command = 'FEAT';
        this.type = this.consts.FEATURE_SUPPORTED;
        this.read = true;
    }
}

module.exports = Feature;