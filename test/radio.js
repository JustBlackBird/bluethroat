var util = require('util'),
    events = require('events'),
    should = require('should'),
    _ = require('lodash'),
    async = require('async'),
    Radio = require('../lib/radio');

/**
 * Builds an instance of EventEmitter class
 */
var getEventEmitter = function() {
    // Temporary constructor is used to prevent modifications of EventEmitter
    // prototype.
    var Tmp = function() {
        events.EventEmitter.call(this);
    };

    util.inherits(Tmp, events.EventEmitter);

    return new Tmp();
};

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
    var noop = function() {},
        client = getEventEmitter();

    // A storage for set commands.
    client._commands = [];

    // Internal Client's status
    client._status = {
        state: 'stop'
    };

    // This is an Error wich should be returned any time a command is sent.
    // false means no error should be returned.
    client._error = false;

    client.sendCommand = function(command, callback) {
        // Make sure stub works fine even if there is no callback specified
        var done = callback || noop;

        client._commands.push(command);

        if (client._error) {
            return callback(client._error);
        }

        var response = '';
        if (command.name === 'status') {
            Object.keys(client._status).forEach(function(key) {
                response += key + ': ' + client._status[key] + '\n';
            });
        }

        done(null, response);
    };

    // This stub is just run "sendCommand" several times.
    client.sendCommands = function(commands, callback) {
        // Make sure stub works fine even if there is no callback specified
        var done = callback || noop;

        var combinedResponse = '';
        async.eachSeries(commands, function(command, next) {
            client.sendCommand(command, function(err, response) {
                combinedResponse += (response || '');
                next(err);
            });
        }, function(err) {
            if (err) {
                return done(err);
            }

            done(null, combinedResponse);
        });
    };

    // This is not a part of MpdClient and is used spy for commands calls.
    client.getRecordedCommands = function() {
        return this._commands;
    };

    // This is not a part of MpdClient API and is used to alter internal
    // client's status.
    client.setInternalStatus = function(status) {
        client._status = status;
    };

    // This is not a part of MpdClient API and is used to return a error for
    // commands.
    client.setInternalError = function(err) {
        client._error = err;
    };

    return client;
};

/**
 * Builds a stub which mimics MpdPool behavior.
 *
 * @param {Object} client An object which will be returned on every call to
 * mock's "getClient" method. By default a stub for mpd client is used.
 * @returns {Object}
 */
var getMpdPool = function(client) {
    var pool = getEventEmitter();

    if (typeof client === 'undefined') {
        client = getMpdClient();
    }

    // Define API methods to mimic real MpdPool instance.
    pool.getClient = function(callback) {
        if (client) {
            return callback(null, client);
        } else {
            return callback(new Error('The client is not specified'));
        }
    };

    pool.isConnected = function() {
        return !!client;
    };

    return pool;
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
        it('should return error if no station is selected', function(done) {
            var radio = new Radio(getMpdPool());
            radio.play(function(err) {
                err.should.be.Error();
                err.message.should.be.equal('You should choose a station before play it.');

                done();
            });
        });

        it('should send "clear", "setvol", "add" and "play" commands to MPD server', function(done) {
            var client = getMpdClient(),
                station = getRadioStation(),
                radio = new Radio(getMpdPool(client));

            radio.setCurrentStation(station);
            radio.play(function(err) {
                should(err).be.null();
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

                done();
            });
        });

        it('should return MPD client error "as is"', function(done) {
            var client = getMpdClient(),
                radio = new Radio(getMpdPool(client));

            // Make sure client return an error
            client.setInternalError(Error('Test'));

            radio.setCurrentStation(getRadioStation());
            radio.play(function(err) {
                err.should.be.Error();
                err.message.should.be.equal('Test');

                done();
            });
        });

        it('should return error if MPD client cannot be got', function(done) {
            var radio = new Radio(getMpdPool(null));

            radio.setCurrentStation(getRadioStation());
            radio.play(function(err) {
                err.should.be.Error();
                // This message is defined in MpdPool stub.
                err.message.should.be.equal('The client is not specified');

                done();
            });
        });
    });

    describe('stop', function() {
        it('should send "stop" and "clear" commands to MPD server', function(done) {
            var client = getMpdClient(),
                radio = new Radio(getMpdPool(client));

            radio.stop(function(err) {
                should(err).be.null();

                var commands = client.getRecordedCommands();
                commands.length.should.be.equal(2);
                commands[0].name.should.be.equal('stop');
                commands[1].name.should.be.equal('clear');

                done();
            });
        });

        it('should return MPD client error "as is"', function(done) {
            var client = getMpdClient(),
                radio = new Radio(getMpdPool(client));

            // Make sure client return an error
            client.setInternalError(new Error('Test'));

            radio.stop(function(err) {
                err.should.be.Error();
                err.message.should.be.equal('Test');

                done();
            });
        });

        it('should return error if MPD client cannot be got', function(done) {
            var radio = new Radio(getMpdPool(null));

            radio.stop(function(err) {
                err.should.be.Error();
                // This message is defined in MpdPool stub.
                err.message.should.be.equal('The client is not specified');

                done();
            });
        });
    });

    describe('fadeIn', function() {
        it('should return error if no station was selected', function(done) {
            var radio = new Radio(getMpdPool());

            radio.fadeIn(150, function(err) {
                err.should.be.Error();
                err.message.should.be.equal('You should choose a station before play it.');

                done();
            });
        });

        it('should return error if too low duration is used', function(done) {
            var radio = new Radio(getMpdPool());

            radio.setCurrentStation(getRadioStation());
            radio.fadeIn(50, function(err) {
                err.should.be.Error();
                err.message.should.be.equal('Duration must be greater than or equal to 100');

                done();
            });
        });

        it('should return error if MPD client cannot be got', function(done) {
            var radio = new Radio(getMpdPool(null));

            radio.setCurrentStation(getRadioStation());
            radio.fadeIn(100, function(err) {
                err.should.be.Error();
                // This message is defined in MpdPool stub.
                err.message.should.be.equal('The client is not specified');

                done();
            });
        });

        it('should return MPD client error "as is"', function(done) {
            var client = getMpdClient(),
                radio = new Radio(getMpdPool(client));

            // Make sure the client return error.
            client.setInternalError(new Error('Test'));

            radio.setCurrentStation(getRadioStation());
            radio.fadeIn(150, function(err) {
                err.should.be.Error();
                err.message.should.be.equal('Test');

                done();
            });
        });

        it('should send correct commands to MPD server', function(done) {
            var client = getMpdClient(),
                radio = new Radio(getMpdPool(client)),
                station = getRadioStation();

            radio.setCurrentStation(station);
            radio.fadeIn(150, function(err) {
                should(err).be.null();

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

                done();
            });
        });
    });

    describe('isPlaying', function() {
        it('should return MPD client error "as is"', function(done) {
            var client = getMpdClient(),
                radio = new Radio(getMpdPool(client));

            // Make sure client return an error
            client.setInternalError(new Error('Test'));

            radio.isPlaying(function(err) {
                err.should.be.Error();
                err.message.should.be.equal('Test');

                done();
            });
        });

        it('should return error if MPD client cannot be got', function(done) {
            var radio = new Radio(getMpdPool(null));

            radio.isPlaying(function(err) {
                err.should.be.Error();
                // This message is defined in MpdPool stub.
                err.message.should.be.equal('The client is not specified');

                done();
            });
        });

        it('should send correct command to MPD server', function(done) {
            var client = getMpdClient(),
                radio = new Radio(getMpdPool(client));

            radio.isPlaying(function(err) {
                should(err).be.null();

                var commands = client.getRecordedCommands();
                commands.length.should.be.equal(1);
                commands[0].name.should.be.equal('status');

                done();
            });
        });

        it('should return true when the MPD state is "play"', function(done) {
            var client = getMpdClient(),
                radio = new Radio(getMpdPool(client));

            client.setInternalStatus({state: 'play'});
            radio.isPlaying(function(err, isPlaying) {
                should(err).be.null();
                isPlaying.should.be.true();

                done();
            });
        });

        it('should return false when the MPD state is "stop"', function(done) {
            var client = getMpdClient(),
                radio = new Radio(getMpdPool(client));

            client.setInternalStatus({state: 'stop'});
            radio.isPlaying(function(err, isPlaying) {
                should(err).be.null();
                isPlaying.should.be.false();

                done();
            });
        });
    });
});
