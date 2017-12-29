const chai = require('chai');
const expect = chai.expect;
const helper = require('../../helper');
const { Quit } = require('../../../lib/commands');
const consts = require('../../../lib/consts');

describe('QUIT command', () => {

    it('should receive GOODBYE answer', async function () {
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        const answer = await new Quit(socketManager).send();
        expect(answer.code).to.be.equal(consts.GOODBYE);
    });
});