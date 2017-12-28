const net = require('net');
const SocketManager = require('../lib/socket-manager');
const Logger = require('../lib/logger');

const logger = new Logger([]);
const options = {
    host: '127.0.0.1',
    port: 2121
};
let socketManager = new SocketManager(options, logger);
let server = null;
let socket = null;

const beforeEachHelper = (param, success, fail) => {
    if (!fail) {
        fail = success;
    }
    console.log('BEFORE');
    return () => {
        return new Promise((resolve, reject) => {
            server = net.createServer(connection => {
                socket = connection;
                connection.write('220 Welcome' + '\r\n');

                connection.once('data', chunk => {
                    connection.removeAllListeners('error');
                    const data = chunk.toString()
                        .replace(/^[^ ]+ /, '')
                        .replace('\r\n', '');
                    console.log('TEST >>>', data, param, data === param);
                    if (data === param) {
                        connection.write(success + '\r\n');
                    } else {
                        connection.write(fail + '\r\n');
                    }

                    resolve();
                });
                connection.once('error', error => {
                    connection.removeAllListeners('data');
                    reject(error);
                });
            });

            server.once('error', error => {
                console.log(error);
                reject(error);
            });
            server.listen(2121, '127.0.0.1', () => {
                resolve();
            });
            server.unref();
        });
    };
};

const closeServer = () => {
  return new Promise(resolve => {
     server.close(() => {
         setTimeout(() => {
             resolve();
         }, 5000);
     });
  });
};

const closeConnection = () => {
  return new Promise(resolve => {
      if (!socket) {
          return resolve();
      }
      socket.destroy();
      resolve();
  });
};

const afterEachHelper = async function() {
    this.timeout(10000);
    await Promise.all([
        closeConnection(),
        closeServer()
    ]);
    await socketManager.finish();
    return socketManager = new SocketManager(options, logger);
};

module.exports = {
    beforeEachHelper,
    afterEachHelper,
    socketManager
};