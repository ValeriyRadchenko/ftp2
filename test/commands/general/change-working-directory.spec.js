const chai = require('chai');
const expect = chai.expect;
const helper = require('../../helper');
const { ChangeWorkingDirectory } = require('../../../lib/commands');
const consts = require('../../../lib/consts');

describe('CWD command', () => {

    it('should receive WORKING_DIRECTORY_SET answer', async function () {
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        const answer = await new ChangeWorkingDirectory(socketManager, 'home/test').send();
        expect(answer.code).to.be.equal(consts.WORKING_DIRECTORY_SET);
    });

    it('should throw Wrong directory error', async function () {
        const socketManager = helper.getSocketManager();
        await socketManager.commandConnect();
        try {
            await new ChangeWorkingDirectory(socketManager, 'home/wrong_dir').send();
        } catch (error) {
            expect(error).to.be.equal('Code does not match WORKING_DIRECTORY_SET');
        }
    });
});