const chai = require('chai');
const expect = chai.expect;
const helper = require('../../helper');
const { User } = require('../../../lib/commands');
const consts = require('../../../lib/consts');

describe('USER command', () => {
    it('should receive USERNAME_OK answer', async function () {
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        const answer = await new User(socketManager, 'test').send();
        expect(answer.code).to.be.equal(consts.USERNAME_OK);
    });
});