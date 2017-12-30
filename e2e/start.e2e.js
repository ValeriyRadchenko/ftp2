const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
let child = null;
before(function () {
    this.timeout(10000);
    return new Promise((resolve, reject) => {
        fs.mkdirSync(path.resolve(__dirname, '..', '.test'));
        child = exec(`java -jar PortableFTPServer.jar 2121 test test ${path.resolve(__dirname, '..', '.test')}`,
            { cwd: path.resolve(__dirname,'server') });
        child.stdout.once('data', chunk => {
            console.log(chunk.toString());
            resolve();
        });
    });
});

after(async function () {
    this.timeout(10000);
    child.kill('SIGTERM');
    fs.rmdirSync(path.resolve(__dirname, '..', '.test'));
    process.exit(0);
});