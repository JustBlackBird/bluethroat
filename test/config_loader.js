var path = require('path'),
    should = require('should'),
    mockFs = require('mock-fs'),
    ConfigLoader = require('../lib/config_loader');

describe('ConfigLoader', function() {
    describe('load', function() {
        it('should throw exception if the file does not exists', function() {
            mockFs({
                // There are no files at all.
            });

            (function() {
                ConfigLoader.load('configs/missed.json');
            }).should.throw(/^File \".*?missed\.json\" is not found/);

            mockFs.restore();
        });

        it('should throw exception if not a file passed in', function() {
            mockFs({
                'configs/not-a-file': {/* empty directory */}
            });

            (function() {
                ConfigLoader.load('configs/not-a-file');
            }).should.throw('Specified config file is not a regular file');

            mockFs.restore();
        });

        it('should throw exception on invalid JSON', function() {
            mockFs({
                'configs/invalid.json': '{'
            });

            (function() {
                ConfigLoader.load('configs/invalid.json');
            }).should.throw(/^Cannot parse config file/);

            mockFs.restore();
        });
    });
});
