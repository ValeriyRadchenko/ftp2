const NetServer = require('./server/mock/net-server');
const helper = require('./helper');

const netServer = new NetServer();

before(async function () {
    this.timeout(100000);
    await netServer.start();
});

after(async function () {
    this.timeout(100000);
    await helper.afterHelper();
    await netServer.stop();
});