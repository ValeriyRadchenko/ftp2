const EventEmitter = require('events').EventEmitter;
const Parser = require('./parser');
const consts = require('./consts');

class BaseCommand extends EventEmitter {
    constructor(socketManager) {
        super();
        this.socketManager = socketManager;
        this.parser = new Parser();
        this.consts = consts;

        this.command = null;
        this.params = null;
        this.type = null;
    }

    parse(chunk) {
        return new Promise((resolve, reject) => {
            this.parser.once('parsed', answer => resolve(answer));
            this.parser.once('error', error => reject(error));
            this.parser.parse(chunk.toString());
        });
    }

    send() {
        return new Promise((resolve, reject) => {
            console.log(this.command, this.params, this.type);

            if (!this.command) {
                reject(new Error('Command is not defined'));
            }

            if (!this.type) {
                reject(new Error('Type is not defined'));
            }

            this.socketManager.once('command-response', chunk => {
                console.log('Answer', this.command, chunk.toString());
                this.parse(chunk)
                    .then(answer => {
                        if (Array.isArray(this.type)) {
                            if (this.type.indexOf(answer.code) < 0) {
                                reject(`Code does not match ${this.type.map(type => this.getKeyByValue(this.consts, type)).join(', ')}`);
                            }
                        } else if (answer.code !== this.type) {
                            reject(`Code does not match ${this.getKeyByValue(this.consts, this.type)}`);
                        }

                        resolve(answer.payload);
                    })
                    .catch(error => {
                        reject(error);
                    });
            });

            let buffer = this.command;
            if (this.params) {
                buffer += ` ${this.params}`;
            }
            buffer += '\r\n';
            this.socketManager.command(buffer.toString('binary'));
        });

    }

    getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }
}

module.exports = BaseCommand;