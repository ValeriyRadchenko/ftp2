const chai = require('chai');
const expect = chai.expect;
const helper = require('../../helper');
const { Mode } = require('../../../lib/commands');
const consts = require('../../../lib/consts');

describe('MODE command', () => {

    it('should receive TRANSFER_MODE_SET answer', async function () {
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        const answer = await new Mode(socketManager, 'S').send();
        expect(answer.code).to.be.equal(consts.TRANSFER_MODE_SET);
    });

    it('should throw Wrong mode error', async function () {
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        try {
            await new Mode(socketManager, 'P').send();
        } catch (error) {
            expect(error).to.be.equal('Code does not match TRANSFER_MODE_SET');
        }
    });
});