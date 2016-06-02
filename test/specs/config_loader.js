var path = require('path'),
    should = require('should'),
    mockFs = require('mock-fs'),
    ConfigLoader = require('../../lib/config_loader');

var getCorrectConfig = function() {
    return {
        server: {
            port: 8080
        },
        mpd: {
            host: 'localhost',
            port: 6600
        },
        radioStations: [
            {
                id: "first",
                name: 'The first',
                url: 'http://example.com/first'
            },
            {
                id: "second",
                name: 'The second',
                url: 'http://example.com/second'
            },
            {
                id: "third",
                name: 'The third',
                url: 'http://example.com/third'
            }
        ],
        defaultRadioStation: 'third',
        storage: {
            settings: "http://127.0.0.1:5984/bluethroat_settings"
        }
    };
};

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

        it('should throw exception on invalid "mpd" field', function() {
            var noMpdConfig = getCorrectConfig();
            delete noMpdConfig.mpd;

            var noMpdHostConfig = getCorrectConfig();
            delete noMpdHostConfig.mpd.host;

            var noMpdPortConfig = getCorrectConfig();
            delete noMpdPortConfig.mpd.port;

            mockFs({
                'configs/no-mpd.json': JSON.stringify(noMpdConfig),
                'configs/no-mpd-host.json': JSON.stringify(noMpdHostConfig),
                'configs/no-mpd-port.json': JSON.stringify(noMpdPortConfig)
            });

            (function() {
                ConfigLoader.load('configs/no-mpd.json');
            }).should.throw('You must specify MPD host and port');

            (function() {
                ConfigLoader.load('configs/no-mpd-host.json');
            }).should.throw('You must specify MPD host and port');

            (function() {
                ConfigLoader.load('configs/no-mpd-port.json');
            }).should.throw('You must specify MPD host and port');

            mockFs.restore();
        });

        it('should throw exception on invalid "radioStations" field', function() {
            var noStationsConfig = getCorrectConfig();
            delete noStationsConfig.radioStations;

            var emptyStationsConfig = getCorrectConfig();
            emptyStationsConfig.radioStations = {};

            mockFs({
                'configs/no-stations.json': JSON.stringify(noStationsConfig),
                'configs/empty-stations.json': JSON.stringify(emptyStationsConfig)
            });

            (function() {
                ConfigLoader.load('configs/no-stations.json');
            }).should.throw('"radioStations" field is missed');

            (function() {
                ConfigLoader.load('configs/empty-stations.json');
            }).should.throw('You must specify at least one radio station');

            mockFs.restore();
        });

        it('should throw exception on invalid "storage" field', function() {
            var noStorageConfig = getCorrectConfig();
            delete noStorageConfig.storage;

            var noSettingsStorageConfig = getCorrectConfig();
            delete noSettingsStorageConfig.storage.settings;

            mockFs({
                'configs/no-storage.json': JSON.stringify(noStorageConfig),
                'configs/no-settings-storage.json': JSON.stringify(noSettingsStorageConfig)
            });

            (function() {
                ConfigLoader.load('configs/no-storage.json');
            }).should.throw('"storage" filed is missed');

            (function() {
                ConfigLoader.load('configs/no-settings-storage.json');
            }).should.throw('You must specify connection params for settings storage');

            mockFs.restore();
        });

        it('should load and parse correct config', function() {
            mockFs({
                'configs/valid.json': JSON.stringify(getCorrectConfig())
            });

            ConfigLoader.load('configs/valid.json').should.be.eql(getCorrectConfig());

            mockFs.restore();
        });

        it('should use default port', function() {
            var config = getCorrectConfig();
            delete config.server;

            mockFs({
                'configs/no-server.json': JSON.stringify(config)
            });

            var loadedConfig = ConfigLoader.load('configs/no-server.json');

            loadedConfig.should.have.property('server');
            loadedConfig.server.should.have.property('port');
            loadedConfig.server.port.should.be.equal(8000);

            mockFs.restore();
        });

        it('should use default radio station', function() {
            var config = getCorrectConfig();
            delete config.defaultRadioStation;

            mockFs({
                'configs/no-default-station.json': JSON.stringify(config)
            });

            var loadedConfig = ConfigLoader.load('configs/no-default-station.json');

            loadedConfig.should.have.property('defaultRadioStation');
            loadedConfig.defaultRadioStation.should.be.equal(config.radioStations[0].id);

            mockFs.restore();
        });
    });
});
