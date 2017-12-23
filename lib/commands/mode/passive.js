const BaseCommand = require('../../base-command');

class Passive extends BaseCommand {
    constructor(socketManager, options) {
        super(socketManager);
        this.socketManager = socketManager;
        this.command = 'PASV';
        this.type = this.consts.PASSIVE_MODE;
        this.options = options;
    }

    async start(CommandClass, params) {
        const payload = await super.send();
        this.commandClass = new CommandClass(this.socketManager, params);

        // A command must be sent before a tls connection will be established
        const actionPromise = this.action();
        await this.connected(payload);

        return actionPromise;
    }

    async connected(payload) {
        return this.socketManager.dataConnect(payload);
    }

    action() {
        return new Promise((resolve, reject) => {
            this.commandClass.send()
                .then(() => {
                    return this.commandClass;
                })
                .then(commandClass => {
                    resolve(this[ commandClass[ 'action' ] ]());
                })
                .catch(reject);
        });
    }

    receive() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.collect(),
                this.dummy()
            ])
                .then(result => {
                    console.log('Done');
                    resolve(this.parser.parseList(result[ 0 ]));
                })
                .catch(reject);
        });
    }

    collect() {
        return new Promise((resolve, reject) => {
            let buffer = '';
            this.socketManager.on('data-chunk', chunk => {
                buffer += chunk;
            });

            this.socketManager.once('data-end', () => {
                resolve(buffer.toString());
            });

            this.socketManager.once('data-error', reject);
        });
    }

    dummy() {
        return new Promise(resolve => {
            this.socketManager.once('command-response', chunk => {
                console.log('DUMMY', chunk.toString());
                resolve();
            })
        });
    }

    stream() {
        return this.socketManager.getDataStream();
    }
}

module.exports = Passive;