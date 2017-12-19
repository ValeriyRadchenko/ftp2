const EventEmitter = require('events').EventEmitter;
const Parser = require('./parser');
const consts = require('./consts');

class BaseCommand extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;
        this.parser = new Parser();
        this.consts = consts;
    }

    parse(chunk) {
        return new Promise((resolve, reject) => {
            this.parser.once('parsed', answer => resolve(answer));
            this.parser.once('error', error => reject(error));
            this.parser.parse(chunk.toString());
        });
    }

    send(command, params) {
        console.log(command, params);
        this.socket.once('data', chunk => {
            console.log('Answer', chunk.toString());
            this.parse(chunk)
                .then(answer => this.emit(this.command, answer))
                .catch(error => {
                    throw error;
                });
        });

        let buffer = command;
        if (params) {
            buffer += ` ${params}`;
        }
        buffer += '\r\n';
        this.socket.write(buffer.toString('binary'));
    }
}

module.exports = BaseCommand;