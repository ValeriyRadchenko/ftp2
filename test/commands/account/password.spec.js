const chai = require('chai');
const expect = chai.expect;
const helper = require('../../helper');
const { Password } = require('../../../lib/commands');

describe('PASS command', () => {

    it('should receive answer ok', async function () {
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        await new Password(socketManager, 'test').send();
    });

    it('should throw Authentication failed.', async function () {
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        try {
            await new Password(socketManager, 'wrong password').send();
        } catch (error) {
            expect(error).to.be.equal('Code does not match LOGIN_SUCCESSFUL');
        }
    });
});