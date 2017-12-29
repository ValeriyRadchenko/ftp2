const chai = require('chai');
const expect = chai.expect;
const helper = require('../../helper');
const { Password } = require('../../../lib/commands');
const consts = require('../../../lib/consts');

describe('PASS command', () => {

    it('should receive LOGIN_SUCCESSFUL answer', async function () {
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        const answer = await new Password(socketManager, 'test').send();
        expect(answer.code).to.be.equal(consts.LOGIN_SUCCESSFUL);
    });

    it('should throw Authentication failed', async function () {
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        try {
            await new Password(socketManager, 'wrong password').send();
        } catch (error) {
            expect(error).to.be.equal('Code does not match LOGIN_SUCCESSFUL');
        }
    });
});