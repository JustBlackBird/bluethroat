var path = require('path'),
    should = require('should'),
    ConfigLoader = require('../lib/config_loader');

var getConfigPath = function(relativePath) {
    return path.normalize(__dirname + '/fixtures/configs/' + relativePath);
};

describe('ConfigLoader', function() {
    describe('load', function() {
        it('should throw exception if the file does not exists', function() {
            (function() {
                ConfigLoader.load(getConfigPath('missed.json'));
            }).should.throw(/^File \".*?missed\.json\" is not found/);
        });

        it('should throw exception if not a file passed in', function() {
            (function() {
                ConfigLoader.load(getConfigPath('not_a_file'));
            }).should.throw('Specified config file is not a regular file');
        });

        it('should throw exception on invalid JSON', function() {
            (function() {
                ConfigLoader.load(getConfigPath('invalid.json'));
            }).should.throw(/^Cannot parse config file/);
        });
    });
});
