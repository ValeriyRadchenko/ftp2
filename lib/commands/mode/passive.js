const BaseCommand = require('../../base-command');

class Passive extends BaseCommand {
    constructor(socketManager) {
        super(socketManager);
        this.socketManager = socketManager;
        this.command = 'PASV';
        this.type = this.consts.PASSIVE_MODE;
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
            this.commandClass.send(true)
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
        this.socketManager.once('command-response', chunk => {
            this.parse(chunk)
                .then(answer => {
                    if (answer.code === this.consts.TRANSFER_COMPLETE) {
                        console.log('Answer', chunk.toString());
                        this.socketManager.emit('data-transfer-end');
                    } else {
                        throw new Error('Transfer error');
                    }
                })
                .catch(error => {
                    this.socketManager.emit('data-transfer-end');
                    console.log(error);
                });
        });
        this.socketManager.emit('data-transfer-start');

        return this.socketManager.getDataStream();
    }
}

module.exports = Passive;