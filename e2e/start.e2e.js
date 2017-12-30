const { exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

let child = null;
const basePath = path.resolve(__dirname, '..', '.test');

before(function () {
    this.timeout(10000);
    return new Promise((resolve, reject) => {

        fs.mkdirSync(basePath);
        fs.writeFileSync(path.resolve(basePath, '1.json'), JSON.stringify({
            test: 'test1'
        }));

        child = exec(`java -jar PortableFTPServer.jar 2121 test test ${basePath}`,
            { cwd: path.resolve(__dirname,'server') });

        child.stdout.once('data', chunk=> {
            console.log(chunk.toString());
            resolve();
        });

        child.stderr.once('data', error => {
            console.log(error);
            rimraf.sync(basePath);
            reject(error);
        });
    });
});

after(async function () {
    this.timeout(20000);
    return new Promise(resolve => {
        if (os.platform() === 'win32') {
            exec(`taskkill /pid ${child.pid} /T /F`, () => {
                exec('tasklist /v /fo csv | findstr /i java.exe', (error, stdout) => {
                    const pid = stdout.match(/"java.exe","(\d+)"/);
                    if (pid) {
                        exec(`taskkill /pid ${pid[1]} /T /F`, () => {
                            rimraf.sync(basePath);
                            resolve();
                        });
                    }
                });

            });
        } else {
            child.kill('SIGTERM');
            rimraf.sync(basePath);
            resolve();
        }
    })

});