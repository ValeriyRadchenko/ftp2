const helper = require('../../helper');
const { User } = require('../../../lib/commands');


describe('USER command', () => {
    it('should receive answer ok', async function () {
        this.timeout(20000);
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        await new User(socketManager, 'test').send();
    });
});