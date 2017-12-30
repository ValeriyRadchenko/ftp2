const chai = require('chai');
const expect = chai.expect;
const helper = require('./helper');
const commands = require('../lib/commands/index');
const consts = require('../lib/consts');
const settings = require('./server/settings.json');

describe('Commands', () => {
    for (const command in settings.commands) {
        const value = settings.commands[command];
        describe(`${command} command`, () => {
            if (value.success) {
                it(`should receive ${value.const} answer`, async function () {
                    const socketManager = helper.getSocketManager();
                    await socketManager.commandConnect();
                    const answer = await new commands[value.class](socketManager, value.successParam).send();
                    expect(answer.code).to.be.equal(consts[value.const]);
                });
            }

            if (value.checkDefaultValue) {
                it(`should receive ${value.const} answer using default value`, async function () {
                    const socketManager = helper.getSocketManager();
                    await socketManager.commandConnect();
                    const answer = await new commands[value.class](socketManager).send();
                    expect(answer.code).to.be.equal(consts[value.const]);
                });
            }

            if (value.fail) {
                it(`should throw ${value.const} error`, async function () {
                    const socketManager = helper.getSocketManager();
                    await socketManager.commandConnect();
                    try {
                        await new commands[value.class](socketManager, value.failParam).send();
                    } catch (error) {
                        if (value.failMessage) {
                            expect(error).to.be.equal(value.failMessage);
                        } else {
                            expect(error).to.be.equal(`Code does not match ${value.const}`);
                        }
                    }
                });
            }
        });
    }
});