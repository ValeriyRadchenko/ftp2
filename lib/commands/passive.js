const BaseCommand = require('../base-command');
const Socket = require('net').Socket;

class Passive extends BaseCommand {
    constructor(baseSocket) {
        super(baseSocket);
        this.baseCommand = 'PASV';
        this.dataSocket = null;
    }

    start() {
        return new Promise((resolve, reject) => {
            super.once(this.command, answer => {
                console.log(answer);
                if (answer.code !== this.consts.PASSIVE_MODE) {
                    reject('Code does not match PASSIVE_MODE');
                }
                this.dataSocket = new Socket();
                this.dataSocket.once('connect', resolve);
                this.dataSocket.once('error', reject);
                this.dataSocket.connect(answer.payload.port, answer.payload.ip);
            });

            super.send(this.baseCommand);
        });
    }

    passiveSend(command, params, type) {
        return new Promise((resolve, reject) => {
            super.once(command, answer => {
                if (answer.code !== type) {
                    reject('Code does not match ' + type);
                }
            });

            let buffer = '';
            this.dataSocket.on('data', chunk => {
                buffer += chunk;
            });

            this.dataSocket.once('end', () => {
                this.dataSocket.destroy();
                resolve(buffer.toString());
            });

            if (params) {
                super.send(command, params);
            } else {
                super.send(command);
            }
        });
    }
}

module.exports = Passive;