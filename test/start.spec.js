const NetServer = require('./server/net-server');
const helper = require('./helper');

const netServer = new NetServer();

before(async function () {
    this.timeout(10000);
    await netServer.start();
});

after(async function () {
    this.timeout(10000);
    await helper.afterHelper();
    await netServer.stop();
});