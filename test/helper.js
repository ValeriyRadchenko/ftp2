const SocketManager = require('../lib/socket-manager');
const Logger = require('../lib/logger');

const logger = new Logger([]);
const options = {
    host: '127.0.0.1',
    port: 2121
};
let socketManager = new SocketManager(options, logger);

const beforeEachHelper = () => {

};

const afterEachHelper = async function() {
    this.timeout(10000);
    await socketManager.finish();
    return socketManager = new SocketManager(options, logger);
};

module.exports = {
    beforeEachHelper,
    afterEachHelper,
    socketManager
};