const chai = require('chai');
const expect = chai.expect;
const Logger = require('../lib/logger');
const mockedStream = () => {
    const callbacks = [];
    return {
        write: (data) => {
            callbacks.forEach(cb => cb(data));
        },
        once: (cb) => {
            callbacks.push(cb);
        }
    }
};

describe('Logger', () => {
    let logger = null;
    beforeEach(() => {
        logger = new Logger([ mockedStream() ]);
    });

    afterEach(() => {
        logger = null;
    });

    it('should write info', done => {
        logger.streams[ 0 ].once(chunk => {
            console.log();
            expect(chunk.toString()).to.be.equal('[INFO] test\r\n');
            done();
        });
        logger.info('test');
    });

    it('should write answer', done => {
        logger.streams[ 0 ].once(chunk => {
            console.log();
            expect(chunk.toString()).to.be.equal('[ANSWER] test\r\n');
            done();
        });
        logger.answer('test');
    });

    it('should write command', done => {
        logger.streams[ 0 ].once(chunk => {
            console.log();
            expect(chunk.toString()).to.be.equal('[COMMAND] test\r\n');
            done();
        });
        logger.command('test');
    });

    it('should write log', done => {
        logger.streams[ 0 ].once(chunk => {
            console.log();
            expect(chunk.toString()).to.be.equal('[TEST] test\r\n');
            done();
        });
        logger.log('TEST', 'test');
    });

    it('should log object', done => {
        logger.streams[ 0 ].once(chunk => {
            console.log();
            expect(chunk.toString()).to.be.equal('[TEST] {"test":"test"}\r\n');
            done();
        });
        logger.log('TEST', { test: 'test' });
    });

    it('should log bad json object', done => {
        logger.streams[ 0 ].once(chunk => {
            console.log();
            expect(chunk.toString()).to.be.equal('[TEST] [object Object]\r\n');
            done();
        });
        const test = {test: 'test'};
        test.circular = test;
        logger.log('TEST', test);
    });

    it('should throw "streams must be an array" error', () => {
        expect((function() {
            new Logger({});
        })).to.throw('streams must be an array')
    });

    it('should be ok with default streams', () => {
        expect((function() {
            new Logger();
        })).to.not.throw();
    });
});