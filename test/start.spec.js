const NetServer = require('./server/mock/net-server');
const netServer = new NetServer();

before(async function () {
    this.timeout(100000);
    await netServer.start();
});

after(async function () {
    this.timeout(100000);
    await netServer.stop();
});