var util = require('util'),
    should = require('should'),
    _ = require('underscore'),
    RadioStationsKeeper = require('../lib/radio_stations_keeper');

/**
 * Builds correct station object by its ID.
 *
 * @param {String} id
 * @returns {Object}
 */
var buildStation = function(id) {
    return {
        id: id,
        name: (id.charAt(0).toUpperCase() + id.slice(1) + ' FM'),
        url: ('http://' + id + 'fm.com')
    };
};

/**
 * Checks that passed in station has all mandatory arguments and they are the
 * same as in correctStation object.
 *
 * @param {Object} station An object to check.
 * @param {Object} correctStation A station object with correct fields.
 */
var validateStation = function(station, correctStation) {
    // Make sure all fields exists
    station.should.have.property('id');
    station.should.have.property('name');
    station.should.have.property('url');

    // Make sure all fields have correct values
    station.id.should.be.equal(correctStation.id);
    station.name.should.be.equal(correctStation.name);
    station.url.should.be.equal(correctStation.url);
};

describe('RadioStationsKeeper', function() {
    describe('constructor', function() {
        it('should throw exception if an invalid station is passed to constuctor', function() {
            (function() {
                new RadioStationsKeeper([{
                    id: 'foo'
                }]);
            }).should.throw();
        });

        it('should keep stations', function(done) {
            var keeper = new RadioStationsKeeper([
                buildStation('foo'),
                buildStation('bar')
            ]);

            keeper.has('foo', function(err, exists) {
                should(err).be.null();
                exists.should.be.true();

                keeper.has('bar', function(err, exists) {
                    should(err).be.null();
                    exists.should.be.true();

                    done();
                });
            });
        });
    });

    describe('has', function() {
        it('should return true for existing stations', function(done) {
            var keeper = new RadioStationsKeeper([
                buildStation('foo')
            ]);

            keeper.has('foo', function(err, exists) {
                should(err).be.null();
                exists.should.be.true();

                done();
            });
        });

        it('should return false for missed stations', function(done) {
            var keeper = new RadioStationsKeeper();

            keeper.has('foo', function(err, exists) {
                should(err).be.null();
                exists.should.be.false();

                done();
            });
        });
    });

    describe('add', function() {
        it('should store added station', function(done) {
            var keeper = new RadioStationsKeeper();

            keeper.has('foo', function(err, exists) {
                should(err).be.null();
                exists.should.be.false();

                keeper.add(buildStation('foo'), function(err) {
                    should(err).be.null();

                    keeper.has('foo', function(err, exists) {
                        should(err).be.null();
                        exists.should.be.true();

                        done();
                    });
                });
            });
        });

        it('should throw error for stations with the same id', function(done) {
            var keeper = new RadioStationsKeeper([
                buildStation('foo')
            ]);

            keeper.add(buildStation('foo'), function(err) {
                err.should.be.Error();
                err.message.should.be.equal('Station "foo" already exists.');

                done();
            });
        });

        it('should throw error for invalid station', function(done) {
            var keeper = new RadioStationsKeeper(),
                station = buildStation('foo');

            delete station.id;

            keeper.add(station, function(err) {
                err.should.be.Error();

                done();
            });
        });
    });

    describe('get', function() {
        it('should return added stations with same fields', function(done) {
            var keeper = new RadioStationsKeeper();

            keeper.add(buildStation('foo'), function(err) {
                should(err).be.null();

                keeper.get('foo', function(err, station) {
                    should(err).be.null();

                    // Make sure retrieved station is correct
                    validateStation(station, buildStation('foo'));

                    done();
                });
            });
        });

        it('should return false if there is no such station', function(done) {
            var keeper = new RadioStationsKeeper();

            keeper.get('foo', function(err, station) {
                should(err).be.null();
                station.should.be.false();

                done();
            });
        });
    });

    describe('all', function() {
        it('should return empty array if there are no stations', function(done) {
            var keeper = new RadioStationsKeeper();

            keeper.all(function(err, stations) {
                should(err).be.null();
                stations.should.be.Array();
                stations.length.should.be.equal(0);

                done();
            });
        });

        it('should return all stations', function(done) {
            var keeper = new RadioStationsKeeper([
                buildStation('foo'),
                buildStation('bar')
            ]);

            keeper.all(function(err, stations) {
                should(err).be.null();
                stations.should.be.Array();
                stations.length.should.be.equal(2);

                // Check that the stations exists
                var foo = _.findWhere(stations, {id: 'foo'});
                var bar = _.findWhere(stations, {id: 'bar'});

                foo.should.be.ok();
                bar.should.be.ok();

                // Check fields of the stations
                validateStation(foo, buildStation('foo'));
                validateStation(bar, buildStation('bar'));

                done();
            });
        });
    });

    describe('validate', function() {
        var keeper = new RadioStationsKeeper();

        it('should work fine for correct station', function() {
            keeper.validate(buildStation('foo')).should.be.false();
        });

        // There are several fields that could be missed. All these fields
        // should be tested in the same way, so duplicated code is just
        // replaced with a simple loop.
        ['id', 'name', 'url'].forEach(function(field) {
            it(util.format('should fail on missed "%s" field', field), function() {
                var station = buildStation('foo');

                // Make sure the field is missed
                delete station[field];

                var validationResult = keeper.validate(station);
                validationResult.should.be.Error();
                validationResult.message.should.be.equal(util.format(
                    '"%s" field is missed.',
                    field
                ));
            });
        });
    });
});
