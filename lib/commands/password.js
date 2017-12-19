const BaseCommand = require('../base-command');

class Password extends BaseCommand {
    constructor(socket, password = 'anonymous') {
        super(socket);
        this.command = 'PASS';
        this.password = password;
    }

    send() {
        return new Promise((resolve, reject) => {
            super.once(this.command, answer => {
                if (answer.code !== this.consts.LOGIN_SUCCESSFUL) {
                    reject('Code does not match LOGIN_SUCCESSFUL');
                }

                resolve(answer);
            });
            super.send(this.command, this.password);
        });
    }
}

module.exports = Password;