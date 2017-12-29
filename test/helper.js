const SocketManager = require('../lib/socket-manager');
const Logger = require('../lib/logger');

const logger = new Logger([]);
const options = {
    host: '127.0.0.1',
    port: 2121
};
const socketManagers = [];

const beforeEachHelper = () => {

};

const afterHelper = async function() {
    for (const socketManager of socketManagers) {
        await socketManager.finish();
    }
};

const getSocketManager = () => {
    const socketManager = new SocketManager(options, logger);
    socketManagers.push(socketManager);
    return socketManager;
};

module.exports = {
    beforeEachHelper,
    afterHelper,
    getSocketManager
};