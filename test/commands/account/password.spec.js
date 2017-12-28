const helper = require('../../helper');
const { Password } = require('../../../lib/commands');

const socketManager = helper.socketManager;

beforeEach(helper.beforeEachHelper('test', '230 Login successful.', '530 Authentication failed.'));
afterEach(helper.afterEachHelper);

describe('PASS command', () => {
    it('should receive answer ok', async function () {
        this.timeout(20000);
        await socketManager.commandConnect();
        await new Password(socketManager, 'test').send();
    });
});