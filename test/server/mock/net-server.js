const net = require('net');
const commandMap = require('./settings.json');

class NetServer {
    constructor(options) {
        this.options = {
            host: '127.0.0.1',
            port: 2121
        };
        this.options = { ...this.options, options };
        this.server = net.createServer(this.onConnection.bind(this));
        this.connections = [];
    }

    onConnection(connection) {
        connection.write('220 Welcome' + '\r\n');
        connection.on('data', chunk => {
            let data = chunk.toString()
                .replace('\r\n', '')
                .trim()
                .match(/^([^ ]+) (.+)$/);

            if (!data) {
                data = chunk.toString()
                    .replace('\r\n', '')
                    .trim()
                    .match(/^([^ ]+)$/);
            }

            if (data) {
                const command = data[ 1 ];
                const params = data[ 2 ] || null;
                const map = commandMap.commands[ command.toUpperCase() ];

                if (map.condition === params) {
                    connection.write(map.success + '\r\n');
                } else {
                    connection.write(commandMap.fail + '\r\n');
                }

            } else {
                connection.write(commandMap.fail + '\r\n');
            }
        });
        this.connections.push(connection);
    }

    start() {
        return new Promise((resolve, reject) => {
            this.server.once('error', reject);
            this.server.listen(this.options.port, this.options.host, resolve);
            this.server.unref();
        });
    }

    async stop() {
        for (const socket of this.connections) {
            await this.stopConnection(socket);
        }
        return this.stopServer();
    }

    stopConnection(socket) {
        return new Promise(resolve => {
            socket.destroy();
            resolve();
        });
    }

    stopServer() {
        return new Promise(resolve => {
            this.server.close(resolve);
        });
    }
}

module.exports = NetServer;