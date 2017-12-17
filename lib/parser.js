const EventEmitter = require('events').EventEmitter;
const consts = require('./consts');

class Parser extends EventEmitter {
    constructor() {
        super();
    }

    parse(string) {
        // console.log('string', string);
        const answerCode = /^\d{3}/.exec(string);
        // console.log('answerCode', answerCode);
        if (!answerCode) {
            this.emit('error', new Error('Cannot parse answer code'));
            return;
        }

        let payload = null;

        if (+answerCode[0] === consts.PASSIVE_MODE) {
            let ip = /\((.+)\)/.exec(string);
            if (!ip || !ip[1]) {
                this.emit('error', new Error('Cannot parse passive mode ip address'));
            }
            ip = ip[1].split(',');
            const port = (parseInt(ip[4], 10) * 256) + parseInt(ip[5], 10);
            ip = `${ip[0]}.${ip[1]}.${ip[2]}.${ip[3]}`;
            payload = { ip, port };
        }

        this.emit('parsed', { code: +answerCode[0], payload });
    }
}

module.exports = Parser;