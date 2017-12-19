const BaseCommand = require('../base-command');

class User extends BaseCommand {
    constructor(socket, username = 'anonymous') {
        super(socket);
        this.command = 'USER';
        this.username = username;
    }

    send() {
        return new Promise((resolve, reject) => {
            super.once(this.command, answer => {
                console.log(answer);
                if (answer.code !== this.consts.USERNAME_OK) {
                    reject('Code does not match USERNAME_OK');
                }

                resolve(answer);
            });
            super.send(this.command, this.username);
        });
    }
}

module.exports = User;