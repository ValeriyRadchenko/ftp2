const consts = require('./consts');

class Parser {

    parse(string, safe = false) {
        const answerCode = /^\d{3}/.exec(string);

        if (!answerCode) {
            if (!safe) {
                throw new Error('Cannot parse answer code');
            }

            return null;
        }

        let payload = null;

        if (+answerCode[0] === consts.PASSIVE_MODE) {
            let ip = /\((.+)\)/.exec(string);
            if (!ip || !ip[1]) {
                throw new Error('Cannot parse passive mode ip address');
            }
            ip = ip[1].split(',');
            const port = (parseInt(ip[4], 10) * 256) + parseInt(ip[5], 10);
            ip = `${ip[0]}.${ip[1]}.${ip[2]}.${ip[3]}`;
            payload = { host: ip, port };
        }

        return { code: +answerCode[0], payload, raw: string };
    }

    parseFeatures(string) {
        if (!string) {
            return string;
        }
        const result = string.split('\r\n');
        result.pop();

        return result;
    }

    parseList(string) {
        const result = [];
        const lines = string.split('\r\n');
        for (const line of lines) {
            const regExp = new RegExp('^([^ ]{10}) +([^ ]{1}) +([^ ]+) +([^ ]+) +([^ ]+) +([^ ]{3}) +([^ ]{2}) +([^ ]{4,5}) +(.+)$');
            const matched = line.match(regExp);
            if (matched) {
                const type = (matched[1][0] === 'd') ? 'd' : 'f';
                const rights = {
                    user: matched[1][1] + matched[1][2] + matched[1][3],
                    group: matched[1][4] + matched[1][5] + matched[1][6],
                    other: matched[1][7] + matched[1][8] + matched[1][9]
                };
                result.push({
                    type,
                    name: matched[9],
                    rights,
                    owner: matched[3],
                    group: matched[4],
                    size: matched[5],
                    date: this.parseDate([matched[6], matched[7], matched[8]])
                });
            }
        }
        return result;
    }

    parseDate(dateArray) {
        if (/:/.test(dateArray[2])) {
            dateArray.splice(2, 0, new Date().getFullYear());
        }

        dateArray.push('GMT+0000');
        return new Date(dateArray.join(' '));
    }
}

module.exports = Parser;