const helper = require('../../helper');
const { User } = require('../../../lib/commands');

const socketManager = helper.socketManager;

// beforeEach(helper.beforeEachHelper('test', '331 Username OK'));
afterEach(helper.afterEachHelper);

describe('USER command', () => {
    it('should receive answer ok', async function () {
        this.timeout(20000);
        await socketManager.commandConnect();
        await new User(socketManager, 'test').send();
    });
});