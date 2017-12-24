class Runner {
    constructor(socketManager) {
        this.socketManager = socketManager;
        this.init();
    }

    init() {
        this.modeCommand = null;
        this.commands = [];
    }

    mode(modeCommand) {
        this.modeCommand = modeCommand;
        return this;
    }

    command(command, params) {
        this.commands.push({ commandClass: command, params });
        return this;
    }

    async run() {
        let modeCommand = null;

        if (this.modeCommand) {
           modeCommand = this.commands.pop();
        }

        for (const command of this.commands) {
            await new command.commandClass(this.socketManager, command.params).send();
        }

        if (this.modeCommand) {
            return new this.modeCommand(this.socketManager)
                .start(modeCommand.commandClass, modeCommand.params);
        }

        this.init();
    }
}

module.exports = Runner;