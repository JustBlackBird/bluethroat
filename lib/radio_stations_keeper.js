var util = require('util'),
    _ = require('underscore');

/**
 * A container that helps to manage radio stations.
 *
 * @param {Array} stations List of stations that will be used once the keeper is
 * created. Each item of the array is an object with "id", "name" and "url"
 * keys.
 * @returns {RadioStationsKeeper}
 */
var RadioStationsKeeper = function(stations) {
    this._stations = {};

    if (stations && stations.length !== 0) {
        stations.forEach(function(station) {
            // Make sure the stations are valid.
            var err = this.validate(station);
            if (err) {
                throw err;
            }

            this._stations[station.id] = station;
        }, this);
    }
};

/**
 * Check if the station with the specified ID exists inside of the keeper.
 *
 * @param {String} id ID of the station to check.
 * @param {Function} callback A function which will be called once station
 * existance will be checked. The first argument of the function is an error
 * object which took place during existance checking or null if everything is
 * fine. The second argument is a boolean value which indicates if the station
 * exists or it does not.
 */
RadioStationsKeeper.prototype.has = function(id, callback) {
    callback(null, _.has(this._stations, id));
};

/**
 * Adds the station to the keeper.
 *
 * @param {Object} station An object which describes radio station. It must have
 * "id", "name" and "url" keys.
 * @param {Function} callback A function which will be called once the station
 * is added to the keeper. If an error took place during adding it will be
 * passed in as the first argument. If there was no error the first argument
 * will be set to null.
 */
RadioStationsKeeper.prototype.add = function(station, callback) {
    var err = this.validate(station);
    if (err) {
        return callback(err);
    }

    var self = this;
    this.has(station.id, function(err, exists) {
        if (err) {
            return callback(err);
        }

        if (exists) {
            return callback(new Error(util.format(
                'Station "%s" already exists.',
                station.id
            )));
        }

        self._stations[station.id] = station;

        callback(null);
    });
};

/**
 * Retrieves radio station from the keeper.
 *
 * @param {String} id ID of the station to retrieve.
 * @param {Function} callback A function which will be called once the station
 * will be loaded. If an error took place during loading an error object will be
 * passed into the function as the first argument. If everything is fine the
 * first argument will be set to null. Loaded station will be passed into the
 * function as the second argument.
 */
RadioStationsKeeper.prototype.get = function(id, callback) {
    var self = this;
    this.has(id, function(err, exists) {
        if (err) {
            return callback(err);
        }

        if (!exists) {
            return callback(null, false);
        }

        callback(null, self._stations[id]);
    });
};

/**
 * Retrueves all stations from the keeper.
 *
 * @param {Function} callback A function which will be called once the stations
 * are loaded. The first argument of the function will be set to error object
 * if something went wrong. Otherwise it will be set to null. The second
 * argument will be set to an array containing all known stations.
 */
RadioStationsKeeper.prototype.all = function(callback) {
    callback(null, _.values(this._stations));
};

/**
 * Checks if the passed in radion station is valid.
 *
 * @param {Object} station Radio station object to validate.
 * @returns {Error|Boolean} Boolean false if the station is valid and an Error
 * object otherwise.
 */
RadioStationsKeeper.prototype.validate = function(station) {
    var mandatoryFields = ['id', 'url', 'name'];

    for (var i = 0, l = mandatoryFields.length; i < l; i++) {
        if (!station.hasOwnProperty(mandatoryFields[i])) {
            return new Error(util.format(
                '"%s" field is missed.',
                mandatoryFields[i]
            ));
        }
    }

    return false;
};

module.exports = RadioStationsKeeper;
