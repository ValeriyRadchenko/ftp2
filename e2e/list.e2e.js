const chai = require('chai');
const expect = chai.expect;
const FTP = require('../lib/ftp');
const fs = require('fs');

describe('Get file list', () => {
    let ftp = null;
    beforeEach(async function() {
        this.timeout(10000);
        ftp = new FTP();

        await ftp.connect({
            host: '127.0.0.1',
            port: 2121,
            user: 'test',
            password: 'test'
        });
    });

    afterEach(async function() {
        this.timeout(10000);
        await ftp.disconnect();
        ftp = null;
    });

    it('should get file list', async function() {
        const list = await ftp.list();
        expect(list[0].name).to.be.equal('1.json');
        expect(list[0].type).to.be.equal('f');
        expect(list[0].size).to.be.equal('16');
    });
});