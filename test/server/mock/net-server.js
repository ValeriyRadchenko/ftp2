const net = require('net');
const commadMap = {
    'USER' : {
        condition: 'test',
        success: '331 Username OK',
        fail: '331 Username OK'
    },
    'PASS': {
        condition: 'test',
        success: '230 Login successful.',
        fail: '530 Authentication failed.'
    },
    'fail': '500 FAIL'
};
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
            const data = chunk.toString()
                .replace('\r\n', '')
                .trim()
                .match(/^([^ ]+) (.+)$/);

            if (data) {
                const command = data[1];
                const params = data[2];
                const map = commadMap[command.toUpperCase()];

                if (map.condition === params) {
                    connection.write(map.success + '\r\n');
                } else {
                    connection.write(map.fail + '\r\n');
                }

            } else {
                connection.write(commadMap.fail + '\r\n');
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