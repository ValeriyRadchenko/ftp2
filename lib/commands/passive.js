const BaseCommand = require('../base-command');
const Socket = require('net').Socket;

class Passive extends BaseCommand {
    constructor(baseSocket) {
        super(baseSocket);
        this.command = 'PASV';
        this.type = this.consts.PASSIVE_MODE;
        this.dataSocket = null;
    }

    async start(command, params, type) {
        const payload = await super.send();
        this.dataSocket = new Socket();
        this.dataSocket.connect(payload.port, payload.ip);
        await this.connected();

        this.command = command;
        this.params = params;
        this.type = type;
        return this.passiveSend();
    }

    connected() {
        return new Promise((resolve, reject) => {
            this.dataSocket.once('connect', () => {
                resolve();
            });
            this.dataSocket.once('error', error => {
                this.dataSocket.destroy();
                reject(error);
            })
        })
    }

    passiveSend() {
        return new Promise((resolve, reject) => {
            let buffer = '';
            this.dataSocket.on('data', chunk => {
                buffer += chunk;
            });

            this.dataSocket.once('end', () => {
                this.dataSocket.destroy();
                resolve(buffer.toString());
            });

            super.send()
                .then(() => {})
                .catch(reject);
        });
    }
}

module.exports = Passive;