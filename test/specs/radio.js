var util = require('util'),
    should = require('should'),
    _ = require('lodash'),
    Promise = require('bluebird'),
    Radio = require('../../lib/radio'),
    FakeMpdClient = require('../mocks/mpd_client'),
    FakeMpdPool = require('../mocks/mpd_pool');

/**
 * Creates a valid radio station.
 *
 * @returns {Object}
 */
var getRadioStation = function() {
    return {
        id: 'foo',
        name: 'Foo FM',
        url: 'http://foofm.com'
    };
};

/**
 * Builds a stub that mimics MpdClient behavior.
 *
 * The main purpose of this stub is to record commands that send to mpd.
 *
 * @returns {Object}
 */
var getMpdClient = function() {
    return new FakeMpdClient();
};

/**
 * Builds a stub which mimics MpdPool behavior.
 *
 * @param {Object} client An object which will be returned on every call to
 * mock's "getClient" method. By default a stub for mpd client is used.
 * @returns {Object}
 */
var getMpdPool = function(client) {
    return new FakeMpdPool(client);
};

describe('Radio', function() {
    describe('setCurrentStation', function() {
        var radio = null;

        beforeEach(function() {
            radio = new Radio(getMpdPool());
        });

        afterEach(function() {
            radio = null;
        });

        it('should throw error on station with missed keys', function() {
            var station = getRadioStation();

            // Make sure that the error is throw when exactly one field is
            // missed.
            Object.keys(station).forEach(function(key) {
                (function() {
                    radio.setCurrentStation(_.omit(station, [key]));
                }).should.throw(util.format(
                    'These keys are missed at station object: "%s"',
                    key
                ));
            });

            // Make sure an error is thrown when several keys are missed
            (function() {
                radio.setCurrentStation(_.omit(station, ['id', 'name']));
            }).should.throw(/^These keys are missed/);

            // Make sure an error is thrown when empty object is used as a
            // station
            (function() {
                radio.setCurrentStation({});
            }).should.throw(/^These keys are missed/);
        });

        it('should works fine with a valid station', function() {
            (function() {
                radio.setCurrentStation(getRadioStation());
            }).should.not.throw();
        });

        it('should works fine on valid station with extra keys', function() {
            (function() {
                var station = getRadioStation();
                station.fooBar = 'Extra field';

                radio.setCurrentStation(station);
            }).should.not.throw();
        });
    });

    describe('getCurrentStation', function() {
        it('should return false when no current station was set', function() {
            var radio = new Radio(getMpdPool());
            radio.getCurrentStation().should.be.false();
        });

        it('should return previously set station', function() {
            var radio = new Radio(getMpdPool());

            radio.setCurrentStation(getRadioStation());
            radio.getCurrentStation().should.be.eql(getRadioStation());
        });
    });

    describe('play', function() {
        it('should return error if no station is selected', function() {
            var radio = new Radio(getMpdPool());

            return radio.play().catch(function(err) {
                err.should.be.Error();
                err.message.should.be.equal('You should choose a station before play it.');
            });
        });

        it('should send "clear", "setvol", "add" and "play" commands to MPD server', function() {
            var client = getMpdClient(),
                station = getRadioStation(),
                pool = getMpdPool(client),
                radio = new Radio(pool);

            radio.setCurrentStation(station);

            return radio.play().then(function() {
                var commands = client.getRecordedCommands();

                // Make sure the commands are in the correct order and have
                // correct arguments.
                commands.length.should.be.equal(4);
                commands[0].name.should.be.equal('clear');
                commands[1].name.should.be.equal('setvol');
                commands[1].args[0].should.be.equal(100);
                commands[2].name.should.be.equal('add');
                commands[2].args[0].should.be.equal(station.url);
                commands[3].name.should.be.equal('play');
                pool.getClientsInUse().should.be.equal(0);
            });
        });

        it('should return MPD client error "as is"', function() {
            var client = getMpdClient(),
                pool = getMpdPool(client),
                radio = new Radio(pool);

            // Make sure client return an error
            client.setInternalError(Error('Test'));

            radio.setCurrentStation(getRadioStation());

            return radio.play().catch(function(err) {
                err.should.be.Error();
                err.message.should.be.equal('Test');
                pool.getClientsInUse().should.be.equal(0);
            });
        });

        it('should return error if MPD client cannot be got', function() {
            var pool = getMpdPool(null),
                radio = new Radio(pool);

            radio.setCurrentStation(getRadioStation());

            return radio.play().catch(function(err) {
                err.should.be.Error();
                // This message is defined in MpdPool stub.
                err.message.should.be.equal('The client is not specified');
                pool.getClientsInUse().should.be.equal(0);
            });
        });
    });

    describe('stop', function() {
        it('should send "stop" and "clear" commands to MPD server', function() {
            var client = getMpdClient(),
                pool = getMpdPool(client),
                radio = new Radio(pool);

            return radio.stop().then(function() {
                var commands = client.getRecordedCommands();
                commands.length.should.be.equal(2);
                commands[0].name.should.be.equal('stop');
                commands[1].name.should.be.equal('clear');
                pool.getClientsInUse().should.be.equal(0);
            });
        });

        it('should return MPD client error "as is"', function() {
            var client = getMpdClient(),
                pool = getMpdPool(client),
                radio = new Radio(pool);

            // Make sure client return an error
            client.setInternalError(new Error('Test'));

            return radio.stop().catch(function(err) {
                err.should.be.Error();
                err.message.should.be.equal('Test');
                pool.getClientsInUse().should.be.equal(0);
            });
        });

        it('should return error if MPD client cannot be got', function() {
            var pool = getMpdPool(null),
                radio = new Radio(pool);

            return radio.stop().catch(function(err) {
                err.should.be.Error();
                // This message is defined in MpdPool stub.
                err.message.should.be.equal('The client is not specified');
                pool.getClientsInUse().should.be.equal(0);
            });
        });
    });

    describe('fadeIn', function() {
        it('should return error if no station was selected', function() {
            var pool = getMpdPool(),
                radio = new Radio(pool);

            return radio.fadeIn(150).catch(function(err) {
                err.should.be.Error();
                err.message.should.be.equal('You should choose a station before play it.');
                pool.getClientsInUse().should.be.equal(0);
            });
        });

        it('should return error if too low duration is used', function() {
            var pool = getMpdPool(),
                radio = new Radio(pool);

            radio.setCurrentStation(getRadioStation());

            return radio.fadeIn(50).catch(function(err) {
                err.should.be.Error();
                err.message.should.be.equal('Duration must be greater than or equal to 100');
                pool.getClientsInUse().should.be.equal(0);
            });
        });

        it('should return error if MPD client cannot be got', function() {
            var pool = getMpdPool(null),
                radio = new Radio(pool);

            radio.setCurrentStation(getRadioStation());

            return radio.fadeIn(100).catch(function(err) {
                err.should.be.Error();
                // This message is defined in MpdPool stub.
                err.message.should.be.equal('The client is not specified');
                pool.getClientsInUse().should.be.equal(0);
            });
        });

        it('should return MPD client error "as is"', function() {
            var client = getMpdClient(),
                pool = getMpdPool(client),
                radio = new Radio(pool);

            // Make sure the client return error.
            client.setInternalError(new Error('Test'));

            radio.setCurrentStation(getRadioStation());

            return radio.fadeIn(150).catch(function(err) {
                err.should.be.Error();
                err.message.should.be.equal('Test');
                pool.getClientsInUse().should.be.equal(0);
            });
        });

        it('should send correct commands to MPD server', function() {
            var client = getMpdClient(),
                pool = getMpdPool(client),
                radio = new Radio(pool),
                station = getRadioStation();

            radio.setCurrentStation(station);

            return radio.fadeIn(150).then(function() {
                var commands = client.getRecordedCommands();

                commands.length.should.be.greaterThan(3);
                // Turn of the volume first
                commands[0].name.should.be.equal('setvol');
                commands[0].args[0].should.be.equal(0);
                // Play the station
                commands[1].name.should.be.equal('add');
                commands[1].args[0].should.be.equal(station.url);
                commands[2].name.should.be.equal('play');

                var currentVolume = 0,
                    volCommands = commands.slice(3);

                // Increase the volume to 100% step by step
                for (var i = 0, l = volCommands.length; i < l; i++) {
                    volCommands[i].name.should.be.equal('setvol');
                    volCommands[i].args[0].should.be.greaterThan(currentVolume);
                    currentVolume = volCommands[i].args[0];
                }

                // Make sure the volume now is 100%
                currentVolume.should.be.equal(100);

                pool.getClientsInUse().should.be.equal(0);
            });
        });
    });

    describe('isPlaying', function() {
        it('should return MPD client error "as is"', function() {
            var client = getMpdClient(),
                pool = getMpdPool(client),
                radio = new Radio(pool);

            // Make sure client return an error
            client.setInternalError(new Error('Test'));

            return radio.isPlaying().catch(function(err) {
                err.should.be.Error();
                err.message.should.be.equal('Test');
                pool.getClientsInUse().should.be.equal(0);
            });
        });

        it('should return error if MPD client cannot be got', function() {
            var pool = getMpdPool(null),
                radio = new Radio(pool);

            return radio.isPlaying().catch(function(err) {
                err.should.be.Error();
                // This message is defined in MpdPool stub.
                err.message.should.be.equal('The client is not specified');

                pool.getClientsInUse().should.be.equal(0);
            });
        });

        it('should send correct command to MPD server', function() {
            var client = getMpdClient(),
                pool = getMpdPool(client),
                radio = new Radio(pool);

            return radio.isPlaying().then(function() {
                var commands = client.getRecordedCommands();
                commands.length.should.be.equal(1);
                commands[0].name.should.be.equal('status');

                pool.getClientsInUse().should.be.equal(0);
            });
        });

        it('should return true when the MPD state is "play"', function() {
            var client = getMpdClient(),
                pool = getMpdPool(client),
                radio = new Radio(pool);

            client.setInternalStatus({state: 'play'});

            return radio.isPlaying().then(function(isPlaying) {
                isPlaying.should.be.true();
                pool.getClientsInUse().should.be.equal(0);
            });
        });

        it('should return false when the MPD state is "stop"', function() {
            var client = getMpdClient(),
                pool = getMpdPool(client),
                radio = new Radio(pool);

            client.setInternalStatus({state: 'stop'});

            return radio.isPlaying().then(function(isPlaying) {
                isPlaying.should.be.false();
                pool.getClientsInUse().should.be.equal(0);
            });
        });
    });
});
