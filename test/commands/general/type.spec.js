const chai = require('chai');
const expect = chai.expect;
const helper = require('../../helper');
const { Type } = require('../../../lib/commands');
const consts = require('../../../lib/consts');

describe('TYPE command', () => {

    it('should receive TRANSFER_MODE_SET answer', async function () {
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        const answer = await new Type(socketManager, 'I').send();
        expect(answer.code).to.be.equal(consts.TRANSFER_MODE_SET);
    });

    it('should throw Wrong mode error', async function () {
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        try {
            await new Type(socketManager, 'P').send();
        } catch (error) {
            expect(error).to.be.equal('Code does not match TRANSFER_MODE_SET');
        }
    });
});